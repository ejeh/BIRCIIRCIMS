import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from './users.schema';
import { Model } from 'mongoose';
import { hashPassword } from 'src/auth/auth';
import { v4 as uuid } from 'uuid';
import config from 'src/config';
import { UserMailerService } from './users.mailer.service';
import {
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  UserNotFoundException,
} from 'src/common/exception';
import { SmsService } from 'src/sms/sms.service';
import { VerificationStatus } from './users.neigbour.schema';
import axios from 'axios';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    private readonly userMailer: UserMailerService,
    private readonly smsService: SmsService, // Assuming you have a SmsService for sending SMS
  ) {}

  /**
   * Creates user and sends activation email.
   * @throws duplicate key error when
   */

  async create(
    firstname: string,
    lastname: string,
    email: string,
    password: string,
    phone: number,
    stateOfOrigin: string,
    lgaOfOrigin: string,
    NIN: number,
    role: string,
    origin: string,
  ): Promise<UserDocument> {
    try {
      const user = await this.userModel.create({
        email: email.toLocaleLowerCase(),
        firstname,
        lastname,
        phone,
        stateOfOrigin,
        lgaOfOrigin,
        NIN,
        role,
        origin,
        password: await hashPassword(password),
        activationToken: uuid(),
        activationExpires: Date.now() + config.auth.activationExpireInMs,
      });
      this.userMailer.sendActivationMail(
        user.email,
        user.id,
        user.activationToken,
        origin,
      );

      return user;
    } catch (error) {
      throw EmailAlreadyUsedException();
    }
  }
  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw UserNotFoundException();
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne(
      { email: email.toLowerCase() },
      // {password: 0}
      '+password',
    );
    if (!user) {
      throw UserNotFoundException();
    }
    return user;
  }

  async findAdminByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne(
      { email: email.toLowerCase() },
      // {password: 0}
      '+password',
    );

    return user;
  }

  async activate(userId: string, activationToken: string) {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          activationToken,
        },
        {
          activationToken: null,
          activationExpires: null,
          isActive: true,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .where('activationExpires')
      .gt(Date.now())
      .exec();

    // if (!user) {
    //   throw ActivationTokenInvalidException();
    // }

    return user;
  }

  async resendActivationEmail(email: string) {
    const user = await this.userModel.findOne({ email });
    // Generate a new activation token (or reuse the old one)
    const activationToken =
      user.activationToken || Math.random().toString(36).substr(2, 10);
    user.activationToken = activationToken;
    await user.save();

    this.userMailer.sendActivationMail(
      user.email,
      user.id,
      user.activationToken,
      origin,
    );
    return { success: true, message: 'Activation email sent successfully' };

    // return user;
  }

  async forgottenPassword(email: string, origin: string) {
    const user = await this.userModel.findOneAndUpdate(
      {
        email: email.toLowerCase(),
      },
      {
        passwordResetToken: uuid(),
        passwordResetExpires: Date.now() + config.auth.passwordResetExpireInMs,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      throw UserNotFoundException();
    }

    this.userMailer.sendForgottenPasswordMail(
      user.email,
      user.passwordResetToken,
      origin,
    );
  }

  async resetPassword(
    email: string,
    passwordResetToken: string,
    newPassword: string,
  ): Promise<UserDocument> {
    // Validate token and update password
    const user = await this.userModel
      .findOneAndUpdate(
        {
          email: email.toLowerCase(),
          passwordResetToken,
        },
        {
          password: await hashPassword(newPassword),
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .where('passwordResetExpires')
      .gt(Date.now())
      .exec();

    if (!user) {
      throw PasswordResetTokenInvalidException();
    }

    // Send confirmation email
    this.userMailer.sendResetPasswordMail(user.email);

    return user;
  }

  async getPaginatedData(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.userModel.find().skip(skip).limit(limit).exec();
    const totalCount = await this.userModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  async sendRequest(
    email: string,
    subject: string,
    body: string,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne(
      { email: email.toLowerCase() },
      // {password: 0}
      '+password',
    );
    if (!user) {
      throw UserNotFoundException();
    }

    this.userMailer.sendMailRequest(user.email, subject, body);
    return user;
  }

  async deleteUserById(userId: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(userId);

    if (!result) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  async initiateVerification(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw UserNotFoundException();
    }

    const now = new Date();

    // Mark expired verifications
    user.neighbor.forEach((ref) => {
      if (
        ref.status === 'pending' &&
        new Date(ref.verificationExpiresAt) < now
      ) {
        ref.status = VerificationStatus.EXPIRED;
      }
    });

    user.family.forEach((ref) => {
      if (
        ref.status === 'pending' &&
        new Date(ref.verificationExpiresAt) < now
      ) {
        ref.status = VerificationStatus.EXPIRED;
      }
    });

    await user.save();

    // Prevent re-initiation if verification is already pending
    // Check for pending verifications
    const allReferences = [...(user.neighbor || []), ...(user.family || [])];

    const hasPending = allReferences.some(
      (ref) =>
        ref.status === 'pending' &&
        new Date(ref.verificationExpiresAt) > new Date(),
    );

    if (hasPending) {
      throw new HttpException(
        'Verification already in progress. Cannot re-initiate.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Process neighbors
    for (const neighbor of user.neighbor || []) {
      if (!neighbor.verificationToken) {
        await this.setupReferenceVerification(user, neighbor, 'neighbor');
      }
    }

    // Process family members
    for (const familyMember of user.family || []) {
      if (!familyMember.verificationToken) {
        await this.setupReferenceVerification(user, familyMember, 'family');
      }
    }

    return this.userModel.findById(userId);
  }

  // Update your verification methods to use SMS service
  private async setupReferenceVerification(
    user: UserDocument,
    reference: any,
    type: 'neighbor' | 'family',
  ) {
    const verificationToken = uuid();
    const verificationLink = `${process.env.FRONTEND_URL}/source/verify-reference.html?token=${verificationToken}&ref=${type}`;

    // Alternative short link option (recommended for SMS)
    const shortLink = await this.generateShortLink(verificationLink);

    // Update reference with verification info
    reference.verificationToken = verificationToken;
    reference.verificationLink = verificationLink;
    reference.status = VerificationStatus.PENDING;

    reference.verificationExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ); // 7 days

    // SMS message template
    const message = `Hello ${reference.firstname},\n\nYou've been listed as a ${type} reference for ${user.firstname} ${user.lastname} (Benue Resident ID).\n\nPlease verify this relationship:\n${shortLink || verificationLink}\n\nThank you!`;

    await this.smsService.sendSms(reference.phone, message);

    // Save the updated user document
    await user.save();
  }

  private async generateShortLink(originalUrl: string): Promise<string> {
    // Implement with your preferred URL shortener
    // Options: Bitly, Firebase Dynamic Links, or your own service
    try {
      const response = await axios.post(
        'https://api-ssl.bitly.com/v4/shorten',
        {
          long_url: originalUrl,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.BITLY_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.link;
    } catch (error) {
      this.logger.warn('Failed to generate short link, using original', error);
      return originalUrl;
    }
  }

  async verifyReference(token: string, verificationData: any) {
    const user = await this.userModel.findOne({
      $or: [
        { 'neighbor.verificationToken': token },
        { 'family.verificationToken': token },
      ],
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    // Find the reference in either neighbors or family
    let reference: any;
    let referenceType: 'neighbor' | 'family' | null = null;

    reference = user.neighbor?.find((n) => n.verificationToken === token);
    if (reference) {
      referenceType = 'neighbor';
    } else {
      reference = user.family?.find((f) => f.verificationToken === token);
      if (reference) {
        referenceType = 'family';
      }
    }

    if (!reference || !referenceType) {
      throw new NotFoundException('Reference not found');
    }

    // Check if verification expired
    if (
      reference.verificationExpiresAt &&
      new Date() > reference.verificationExpiresAt
    ) {
      throw new BadRequestException('Verification link has expired');
    }

    // Update reference with verification data
    reference.knowsApplicant = verificationData.knowsApplicant;
    reference.knownDuration = verificationData.knownDuration;
    reference.isResident = verificationData.isResident;
    reference.comments = verificationData.comments;
    reference.status = verificationData.knowsApplicant
      ? VerificationStatus.VERIFIED
      : VerificationStatus.DENIED;
    reference.verifiedAt = new Date();
    reference.verificationToken = null;
    reference.deviceInfo = ''; //this.getDeviceInfo(req)// Add device info if available

    await user.save();

    // 6. Return relevant information
    return {
      success: true,
      referenceType,
      reference: {
        name: reference.name,
        status: reference.status,
        verifiedAt: reference.verifiedAt,
      },
      applicant: {
        id: user.id,
        fullName: `${user.firstname} ${user.lastname}`,
      },
    };
  }

  async getVerificationDetails(token: string) {
    const user = await this.userModel.findOne({
      $or: [
        { 'neighbor.verificationToken': token },
        { 'family.verificationToken': token },
      ],
    });

    if (!user) {
      throw new NotFoundException('Invalid verification token');
    }

    // Find the reference
    let reference;
    let referenceType;

    reference = user.neighbor?.find((n) => n.verificationToken === token);
    if (reference) {
      referenceType = 'neighbor';
    } else {
      reference = user.family?.find((f) => f.verificationToken === token);
      if (reference) {
        referenceType = 'family';
      }
    }

    if (!reference || !referenceType) {
      throw new NotFoundException('Reference not found');
    }

    return {
      applicant: {
        id: user.id,
        fullName: `${user.firstname} ${user.lastname}`,
      },
      referenceType,
      referenceName: reference.fullName,
    };
  }

  async checkPendingVerifications() {
    const threeDaysAgo = new Date(Date.now() - 5 * 1000); // For testing
    //   // const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const usersWithPending = await this.userModel.find({
      $or: [
        {
          neighbor: {
            $elemMatch: {
              status: 'pending',
              isFollowUpSent: false,
            },
          },
        },
        {
          family: {
            $elemMatch: {
              status: 'pending',
              isFollowUpSent: false,
            },
          },
        },
      ],
    });

    for (const user of usersWithPending) {
      // Process neighbors
      for (const neighbor of user.neighbor || []) {
        const verificationTime = neighbor.verifiedAt
          ? new Date(neighbor.verifiedAt)
          : new Date(neighbor.updatedAt);

        const needsFollowUp =
          neighbor.status === 'pending' &&
          !neighbor.isFollowUpSent &&
          verificationTime <= threeDaysAgo;

        if (needsFollowUp) {
          await this.sendFollowUp(user, neighbor, 'neighbor');
        }
      }

      // Process family
      for (const familyMember of user.family || []) {
        const verificationTime = familyMember.verifiedAt
          ? new Date(familyMember.verifiedAt)
          : new Date(familyMember.updatedAt);

        const needsFollowUp =
          familyMember.status === 'pending' &&
          !familyMember.isFollowUpSent &&
          verificationTime <= threeDaysAgo;

        if (needsFollowUp) {
          await this.sendFollowUp(user, familyMember, 'family');
        }
      }
    }
  }

  private async sendFollowUp(
    user: UserDocument,
    reference: any,
    type: 'neighbor' | 'family',
  ) {
    const message = `Reminder: Please verify your reference for ${user.firstname} ${user.lastname} by clicking this link: ${reference.verificationLink}`;

    // Replace this with actual SMS sending
    // const smsSent = true; // or await this.smsService.sendSms(reference.phone, message);
    const smsSent = await this.smsService.sendSms(reference.phone, message);

    if (smsSent) {
      const arrayFilterKey = type === 'neighbor' ? 'n' : 'f';
      const path = `${type}.$[${arrayFilterKey}].isFollowUpSent`;

      await this.userModel.updateOne(
        { _id: user._id },
        { $set: { [path]: true } },
        {
          arrayFilters: [{ [`${arrayFilterKey}._id`]: reference._id }],
        },
      );
    } else {
      // Optional: notify admin if SMS fails
      this.logger.warn(`SMS failed for ${type} reference ${reference.name}`);
    }
  }
}
