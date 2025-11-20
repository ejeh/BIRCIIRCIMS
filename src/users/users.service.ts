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
import {
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  UserNotFoundException,
} from 'src/common/exception';
import { SmsService } from 'src/sms/sms.service';
import { VerificationStatus } from './users.neigbour.schema';
import axios from 'axios';
import { MailService } from '../mail/mail.service';
import { UpdateUserAdminDto, UpdateUserRoleDto } from './users.dto';
import { Certificate } from 'src/indigene-certificate/indigene-certicate.schema';
import { IdCard } from 'src/idcard/idcard.schema';
import { Transaction } from 'src/transaction/transaction.schema';
import { Kindred } from 'src/kindred/kindred.schema';
import { RolePermission } from 'src/roles/role-permission.schema';
import { NotificationsService } from 'src/notifications/notifications.service';
import { RoleAssignmentService } from 'src/roles/role-assignment.service';
import { UserRole } from './users.role.enum';
import { Types } from 'mongoose';
import PDFDocument from 'pdfkit';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    @InjectModel('Certificate') private readonly certModel: Model<Certificate>,
    @InjectModel('IdCard') private readonly idCardModel: Model<IdCard>,
    @InjectModel('Transaction') private readonly transModel: Model<Transaction>,
    @InjectModel('Kindred') private kindredModel: Model<Kindred>,
    @InjectModel(RolePermission.name)
    private rolePermissionModel: Model<RolePermission>,
    private readonly notificationsService: NotificationsService,
    private readonly roleAssignmentService: RoleAssignmentService,
    private readonly smsService: SmsService,
    private readonly mailService: MailService,
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
    kindred: string,
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
        kindred,
        origin,
        password: await hashPassword(password),
        activationToken: uuid(),
        activationExpires: Date.now() + config.auth.activationExpireInMs,
      });

      this.mailService.sendActivationMail(
        user.email,
        user.id,
        user.activationToken,
        'activate-account',
      );

      return user;
    } catch (error) {
      throw EmailAlreadyUsedException();
    }
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(id)
      .select('+family +neighbor')
      .populate('lga', 'name headquaters')
      .exec();
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

    this.mailService.sendActivationMail(
      user.email,
      user.id,
      user.activationToken,
      'activate-account',
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

    this.mailService.sendForgottenPasswordMail(
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
    this.mailService.sendResetPasswordMail(user.email);

    return user;
  }

  async getPaginatedData(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.userModel
      .find()
      .skip(skip)
      .limit(limit)
      .populate('lga', 'name headquaters')
      .exec();
    const totalCount = await this.userModel.countDocuments().exec();
    return {
      data,
      hasNextPage: skip + limit < totalCount,
    };
  }

  // async updateUserRole(id: string, body: UpdateUserRoleDto, currentUser: any) {
  //   const targetUser = await this.userModel.findById(id);
  //   if (!targetUser) {
  //     throw new NotFoundException('User not found');
  //   }

  //   // Restrict: support_admin cannot update another support_admin
  //   if (
  //     currentUser.role === UserRole.SUPPORT_ADMIN &&
  //     targetUser.role === UserRole.SUPPORT_ADMIN
  //   ) {
  //     throw new ForbiddenException(
  //       'Support Admins are not allowed to modify other Support Admins',
  //     );
  //   }

  //   // Proceed to update the role
  //   const updatedUser = await this.userModel.findByIdAndUpdate(
  //     id,
  //     { role: body.role },
  //     { new: true },
  //   );

  //   return updatedUser;
  // }

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

    this.mailService.sendMailRequest(user.email, subject, body);
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

    // Check for at least one valid reference (name and phone)
    const allReferencesData = [
      ...(user.neighbor || []),
      ...(user.family || []),
    ];

    // FIX: Use some() instead of every() to check if AT LEAST ONE reference is valid
    const hasValidReference = allReferencesData.some(
      (ref) => ref.name && ref.phone,
    );

    if (!hasValidReference) {
      throw new HttpException(
        'Cannot initiate verification: No valid references with both name and phone provided.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // NEW: Check for duplicate phone numbers and emails across all references
    const phoneNumbers = allReferencesData
      .filter((ref) => ref.phone)
      .map((ref) => ref.phone);

    const emails = allReferencesData
      .filter((ref) => ref.email)
      .map((ref) => ref.email);

    const uniquePhones = new Set(phoneNumbers);
    const uniqueEmails = new Set(emails);

    if (uniquePhones.size !== phoneNumbers.length) {
      throw new HttpException(
        'Duplicate phone numbers found in references. Each reference must have a unique phone number.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (uniqueEmails.size !== emails.length) {
      throw new HttpException(
        'Duplicate emails found in references. Each reference must have a unique email.',
        HttpStatus.BAD_REQUEST,
      );
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

    // FIX: Filter for references without verification tokens instead of pending status
    const neighborsWithoutToken = (user.neighbor || []).filter(
      (ref) => ref.name && ref.phone && !ref.verificationToken,
    );

    const familyWithoutToken = (user.family || []).filter(
      (ref) => ref.name && ref.phone && !ref.verificationToken,
    );

    if (neighborsWithoutToken.length === 0 && familyWithoutToken.length === 0) {
      throw new HttpException(
        'No references available for verification.',
        HttpStatus.BAD_REQUEST,
      );
    }

    //   // Get references with pending status and unexpired
    const pendingNeighbors = (user.neighbor || []).filter(
      (ref) => ref.name && ref.phone && ref.status === 'pending',
    );

    const pendingFamily = (user.family || []).filter(
      (ref) => ref.name && ref.phone && ref.status === 'pending',
    );

    if (pendingNeighbors.length === 0 && pendingFamily.length === 0) {
      throw new HttpException(
        'No pending references available for verification.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Send verification to references without tokens
    for (const neighbor of neighborsWithoutToken) {
      await this.setupReferenceVerification(user, neighbor, 'neighbor');
    }

    for (const familyMember of familyWithoutToken) {
      await this.setupReferenceVerification(user, familyMember, 'family');
    }

    return this.userModel.findById(userId);
  }

  private async setupReferenceVerification(
    user: UserDocument,
    reference: any,
    type: 'neighbor' | 'family',
  ) {
    const verificationToken = uuid();
    const verificationLink = `${process.env.FRONTEND_URL}/app/verify-reference.html?token=${verificationToken}&ref=${type}`;

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

    await this.mailService.sendReferenceVerificationEmail(
      type,
      reference.email,
      reference.name,
      verificationLink,
      user.firstname + ' ' + user.lastname,
    );

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

    // Determine the new status
    const newStatus = verificationData.knowsApplicant
      ? VerificationStatus.VERIFIED
      : VerificationStatus.DENIED;

    // Create the history entry object
    const historyEntry = {
      date: new Date(),
      status: newStatus,
      comments: verificationData.comments,
      deviceInfo: reference.deviceInfo || 'Unknown Device', // Use provided device info or a default
      verifiedBy: reference.name, // The person who verified
    };

    // Ensure the verificationHistory array exists and push the new entry
    if (!reference.verificationHistory) {
      reference.verificationHistory = [];
    }
    reference.verificationHistory.push(historyEntry);

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
    // const threeDaysAgo = new Date(Date.now() - 5 * 1000); // For testing
    const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

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

  /**
   * Retrieves the verification history for a specific reference (neighbor or family).
   * @param userId The ID of the user.
   * @param refId The ID of the reference (neighbor or family member).
   * @returns The verification history array.
   */
  async getVerificationHistory(userId: string, refId: string): Promise<any[]> {
    // Validate the provided IDs
    if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(refId)) {
      throw new NotFoundException('Invalid User or Reference ID format.');
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    // Combine neighbor and family references into one array for searching
    const allReferences = [
      ...user.neighbor.map((n) => ({ ...n.toObject(), type: 'neighbor' })),
      ...user.family.map((f) => ({ ...f.toObject(), type: 'family' })),
    ];

    // console.log('allReferences', allReferences);

    // Find the specific reference by its ID
    const reference = allReferences.find((ref) => ref._id.toString() === refId);

    if (!reference) {
      throw new NotFoundException('Reference not found.');
    }

    // Return the verification history. If it doesn't exist, return an empty array.
    return reference.verificationHistory || [];
  }

  // 📝 Update user details
  async updateUser(id: string, updateUserAdminDto: UpdateUserAdminDto) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserAdminDto },
      { new: true },
    );

    if (!user) throw new NotFoundException('User not found');
    return { message: 'User updated successfully', data: user };
  }

  // 🚫 Toggle user active/inactive
  async toggleUserStatus(id: string) {
    const user = await this.userModel.findById(id);
    if (!user) throw new NotFoundException('User not found');

    user.isActive = !user.isActive;
    await user.save();

    const status = user.isActive ? 'activated' : 'deactivated';
    return { message: `User successfully ${status}`, data: user };
  }

  // user.service.ts
  async getMemberStats() {
    const users = await this.userModel
      .find()
      .select('DOB gender stateOfOrigin')
      .lean();

    // --- AGE DISTRIBUTION ---
    const ageDistribution: Record<string, number> = {};
    users.forEach((user) => {
      if (user.DOB) {
        const dob = new Date(user.DOB);
        const age = new Date().getFullYear() - dob.getFullYear();
        const bucket = `${Math.floor(age / 10) * 10}-${Math.floor(age / 10) * 10 + 9}`; // e.g. "20-29"
        ageDistribution[bucket] = (ageDistribution[bucket] || 0) + 1;
      }
    });

    // --- GENDER DISTRIBUTION ---
    const genderDistribution: Record<string, number> = { male: 0, female: 0 };
    users.forEach((user) => {
      if (user.gender?.toLowerCase() === 'male') genderDistribution.male++;
      else if (user.gender?.toLowerCase() === 'female')
        genderDistribution.female++;
    });

    // --- STATE DISTRIBUTION ---
    const stateDistribution: Record<string, number> = {};
    users.forEach((user) => {
      if (user.stateOfOrigin) {
        stateDistribution[user.stateOfOrigin] =
          (stateDistribution[user.stateOfOrigin] || 0) + 1;
      }
    });

    return {
      total: users.length,
      ageDistribution,
      genderDistribution,
      stateDistribution,
    };
  }

  /**
   * Gets dashboard statistics, optionally filtered by a date range.
   * @param startDate Optional start date in 'YYYY-MM-DD' format.
   * @param endDate Optional end date in 'YYYY-MM-DD' format.
   */
  async getDashboardStats(startDate?: string, endDate?: string) {
    // 1. Create the date match object. This will be used in all queries.
    const dateMatch: any = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {};
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }

    // --- Registration Trend from Users ---
    const registrations = await this.userModel.aggregate([
      { $match: dateMatch }, // Apply date filter
      {
        $group: {
          _id: { $month: '$created_at' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const registrationTrend = months.map((m, idx) => {
      const found = registrations.find((r) => r._id === idx + 1);
      return found ? found.count : 0;
    });

    // --- Request Status from Certificate + IdCard ---
    const certStatuses = await this.certModel.aggregate([
      { $match: dateMatch }, // Apply date filter
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const idcardStatuses = await this.idCardModel.aggregate([
      { $match: dateMatch }, // Apply date filter
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusMap: Record<string, number> = {
      Approved: 0,
      Pending: 0,
      Rejected: 0,
    };
    [...certStatuses, ...idcardStatuses].forEach((s) => {
      if (s._id) statusMap[s._id] = (statusMap[s._id] || 0) + s.count;
    });

    // --- Top LGAs from Certificate model ---
    const certLgas = await this.certModel.aggregate([
      { $match: dateMatch }, // Apply date filter
      {
        $group: {
          _id: '$lgaOfOrigin',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);
    const topLGAs = certLgas.map((lga) => ({
      name: lga._id || 'Unknown',
      count: lga.count,
    }));

    // --- Payment summary from Transaction model ---
    const paymentSummary = await this.transModel.aggregate([
      { $match: dateMatch }, // Apply date filter
      {
        $group: {
          _id: '$status',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);
    const payments = {
      total: paymentSummary.reduce((acc, t) => acc + t.count, 0),
      success: paymentSummary.find((t) => t._id === 'success')?.count || 0,
      failed: paymentSummary.find((t) => t._id === 'failed')?.count || 0,
      pending: paymentSummary.find((t) => t._id === 'pending')?.count || 0,
      totalAmount: paymentSummary.reduce((acc, t) => acc + t.totalAmount, 0),
    };

    // --- Recent Activity ---
    // Fetch recent items with the date filter applied
    const [certificates, idcards, recentUsers, recentTransactions] =
      await Promise.all([
        this.certModel.find(dateMatch).sort({ created_at: -1 }).limit(5).lean(),
        this.idCardModel
          .find(dateMatch)
          .sort({ created_at: -1 })
          .limit(5)
          .lean(),
        this.userModel.find(dateMatch).sort({ created_at: -1 }).limit(5).lean(),
        this.transModel
          .find(dateMatch)
          .sort({ createdAt: -1 })
          .limit(5)
          .select('amount status paymentType reference createdAt'),
      ]);

    // Combine and normalize recent activities
    const recentActivities = [
      ...certificates.map((cert) => ({
        name: `${cert.firstname} ${cert.lastname}`,
        type: 'certificate',
        status: cert.status,
        createdAt: cert.created_at,
      })),
      ...idcards.map((id) => ({
        name: `${id.firstname} ${id.lastname}`,
        type: 'idcard',
        status: id.status,
        createdAt: id.created_at,
      })),
      ...recentUsers.map((u) => ({
        name: `${u.firstname} ${u.lastname}`,
        type: 'user',
        status: u.isActive ? 'Active' : 'Inactive',
        role: u.role,
        createdAt: u.created_at,
      })),
      ...recentTransactions.map((t) => ({
        type: 'transaction',
        ref: t.reference,
        amount: t.amount,
        paymentType: t.paymentType,
        status: t.status,
        createdAt: t.createdAt,
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 5);

    const totalUsers = await this.userModel.countDocuments(dateMatch);
    const activeUsers = await this.userModel.countDocuments({ isActive: true });

    return {
      totals: {
        certificates: await this.certModel.countDocuments(dateMatch), // Apply filter
        idcards: await this.idCardModel.countDocuments(dateMatch), // Apply filter
        transactions: payments.total,
      },
      totalUsers,
      activeUsers,
      registrationTrend,
      payments,
      requestStatus: statusMap,
      topLGAs,
      recentActivities,
    };
  }

  async getAnalytics() {
    // Fetch all collections
    const users = await this.userModel.find({}, 'created_at').lean();
    const idCards = await this.idCardModel.find({}, 'created_at').lean();
    const certificates = await this.certModel.find({}, 'created_at').lean();

    // Group monthly
    const monthlyUserGrowth = this.aggregateByMonth(users, 'created_at');
    const monthlyRequestVolume = this.aggregateByMonth(
      [...idCards, ...certificates],
      'created_at',
    );

    // Real dynamic request type distribution
    const requestTypeDistribution: Record<string, number> = {};

    if (idCards.length > 0) {
      requestTypeDistribution['Identity Card'] = idCards.length;
    }

    if (certificates.length > 0) {
      requestTypeDistribution['Certificate of Origin'] = certificates.length;
    }

    // Add optional other categories if needed
    requestTypeDistribution['Verification'] = 0;
    requestTypeDistribution['Renewal'] = 0;

    // Compute sample processing time (for now still static)
    const averageProcessingTime = {
      'Identity Card': 24,
      Certificate: 48,
      Verification: 12,
      Approval: 6,
    };

    return {
      monthlyUserGrowth,
      monthlyRequestVolume,
      averageProcessingTime,
      requestTypeDistribution,
    };
  }

  /**
   * Aggregates an array of documents by month based on a date field.
   * Returns an object with month names as keys and counts as values.
   */
  private aggregateByMonth(
    items: any[],
    dateField: string,
  ): Record<string, number> {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const result: Record<string, number> = {};
    items.forEach((item) => {
      const date = item[dateField] ? new Date(item[dateField]) : null;
      if (date && !isNaN(date.getTime())) {
        const month = months[date.getMonth()];
        result[month] = (result[month] || 0) + 1;
      }
    });
    // Ensure all months are present
    months.forEach((m) => {
      if (!result[m]) result[m] = 0;
    });
    return result;
  }

  async findAll() {
    return this.userModel.find().select('-password').exec();
  }

  async findByLGA(lgaOfOrigin: string) {
    // Adjust field name if your schema uses `lgaOfOrigin` or `lga`
    return this.userModel
      .find({ lgaOfOrigin: { $regex: new RegExp(`^${lgaOfOrigin}$`, 'i') } })
      .select('-password')
      .exec();
  }

  /** 📈 TREND DATA (ID card + certificate per month) */
  async getTrends(lgaOfOrigin: string, startDate?: string, endDate?: string) {
    // ====== START: ADD DATE FILTERING LOGIC ======
    // Create a filter object to be used in the database queries.
    const dateMatch: any = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {}; // Assuming you have a `createdAt` field
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }
    // ====== END: DATE FILTERING LOGIC ======
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    // --- MONTHLY TREND (No changes needed here) ---
    const idCardData = await this.idCardModel.aggregate([
      { $addFields: { userIdObjectId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: false } },
      { $match: { 'user.lgaOfOrigin': lgaOfOrigin, ...dateMatch } },
      { $group: { _id: { $month: '$created_at' }, count: { $sum: 1 } } },
    ]);

    const certData = await this.certModel.aggregate([
      { $match: { lgaOfOrigin, ...dateMatch } },
      { $group: { _id: { $month: '$created_at' }, count: { $sum: 1 } } },
    ]);

    const idCardRequests = months.map((_, i) => {
      const monthNumber = i + 1;
      const found = idCardData.find((x) => x._id === monthNumber);
      return found ? found.count : 0;
    });

    const certificateRequests = months.map((_, i) => {
      const monthNumber = i + 1;
      const found = certData.find((x) => x._id === monthNumber);
      return found ? found.count : 0;
    });

    // ====== DAILY TREND (LAST 7 DAYS) - REFACTORED ======
    const idCardDaily = await this.idCardModel.aggregate([
      { $addFields: { userIdObjectId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.lgaOfOrigin': lgaOfOrigin, ...dateMatch } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
      { $sort: { _id: 1 } }, // re-sort chronologically
    ]);

    const certDaily = await this.certModel.aggregate([
      { $match: { lgaOfOrigin, ...dateMatch } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
      { $limit: 7 },
      { $sort: { _id: 1 } },
    ]);

    // --- NEW LOGIC: Align daily data correctly ---
    // 1. Combine all unique dates from both ID cards and certificates
    const allDates = [
      ...idCardDaily.map((d) => d._id),
      ...certDaily.map((d) => d._id),
    ];

    // 2. Create a sorted, unique list of labels. This is our source of truth.
    const dailyLabels = [...new Set(allDates)].sort();

    // 3. Create maps for fast lookups of counts by date
    const idCardMap = new Map(idCardDaily.map((d) => [d._id, d.count]));
    const certMap = new Map(certDaily.map((d) => [d._id, d.count]));

    // 4. Build the final, perfectly aligned data arrays
    const dailyIdCardRequests = dailyLabels.map(
      (label) => idCardMap.get(label) || 0,
    );
    const dailyCertificateRequests = dailyLabels.map(
      (label) => certMap.get(label) || 0,
    );

    // ====== TIME TREND (HOURS OF DAY) - No changes needed here ======
    const idCardTime = await this.idCardModel.aggregate([
      { $addFields: { userIdObjectId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.lgaOfOrigin': lgaOfOrigin, ...dateMatch } },
      { $group: { _id: { $hour: '$created_at' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const certTime = await this.certModel.aggregate([
      { $match: { lgaOfOrigin, ...dateMatch } },
      { $group: { _id: { $hour: '$created_at' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const idCardByHour = hourLabels.map((_, h) => {
      const found = idCardTime.find((x) => x._id === h);
      return found ? found.count : 0;
    });
    const certByHour = hourLabels.map((_, h) => {
      const found = certTime.find((x) => x._id === h);
      return found ? found.count : 0;
    });

    // --- FINAL RETURN OBJECT ---
    return {
      monthly: { labels: months, idCardRequests, certificateRequests },
      daily: {
        // Use the new, correctly aligned data
        labels: dailyLabels,
        idCardRequests: dailyIdCardRequests,
        certificateRequests: dailyCertificateRequests,
      },
      hourly: {
        labels: hourLabels,
        idCardRequests: idCardByHour,
        certificateRequests: certByHour,
      },
    };
  }

  /** 👥 DEMOGRAPHICS (gender, age, and combined gender-age groups) */
  async getDemographics(
    lgaOfOrigin: string,
    startDate?: string,
    endDate?: string,
  ) {
    // const users = await this.userModel
    //   .find({ lgaOfOrigin })
    //   .select('gender DOB')
    //   .lean();

    // ====== START: ADD DATE FILTERING LOGIC ======
    // Create a filter object to be used in the database query.
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.created_at = {}; // Assuming you have a `createdAt` field
      if (startDate) dateFilter.created_at.$gte = new Date(startDate);
      if (endDate) dateFilter.created_at.$lte = new Date(endDate);
    }
    // ====== END: DATE FILTERING LOGIC ======

    // Find users, applying both the LGA and date filters
    const users = await this.userModel
      .find({ lgaOfOrigin, ...dateFilter }) // Spread the dateFilter into the query
      .select('gender DOB createdAt') // Select createdAt for debugging if needed
      .lean();

    // ====== COMBINED AGE+GENDER GROUPS ======
    const combinedGroups = {
      'Male 18-35': 0,
      'Female 18-35': 0,
      'Male 36+': 0,
      'Female 36+': 0,
    };

    // ====== GENDER DISTRIBUTION ======
    const genderDist = {
      Male: 0,
      Female: 0,
    };

    // ====== AGE DISTRIBUTION ======
    const ageDist = {
      'Under 18': 0,
      '18-25': 0,
      '26-35': 0,
      '36-50': 0,
      '51+': 0,
    };

    users.forEach((u) => {
      if (!u.gender || !u.DOB) return;

      const dob = new Date(u.DOB);
      const age = new Date().getFullYear() - dob.getFullYear();

      // Gender distribution
      if (u.gender.toLowerCase() === 'male') genderDist.Male++;
      else if (u.gender.toLowerCase() === 'female') genderDist.Female++;

      // Age distribution
      if (age < 18) ageDist['Under 18']++;
      else if (age <= 25) ageDist['18-25']++;
      else if (age <= 35) ageDist['26-35']++;
      else if (age <= 50) ageDist['36-50']++;
      else ageDist['51+']++;

      // Combined gender-age grouping
      if (u.gender === 'male' && age <= 35) combinedGroups['Male 18-35']++;
      else if (u.gender === 'female' && age <= 35)
        combinedGroups['Female 18-35']++;
      else if (u.gender === 'male' && age > 35) combinedGroups['Male 36+']++;
      else if (u.gender === 'female' && age > 35)
        combinedGroups['Female 36+']++;
    });

    return {
      genderDistribution: {
        labels: Object.keys(genderDist),
        values: Object.values(genderDist),
      },
      ageDistribution: {
        labels: Object.keys(ageDist),
        values: Object.values(ageDist),
      },
      combinedGroups: {
        labels: Object.keys(combinedGroups),
        values: Object.values(combinedGroups),
      },
    };
  }

  /** 🏘 KINDRED ACTIVITY */
  async getKindredActivity(lgaOfOrigin: string) {
    const kindreds = await this.kindredModel
      .find({ lgaOfOrigin })
      .select('firstname lastname')
      .lean();
    const activity: Record<string, number> = {};

    for (const k of kindreds) {
      const certCount = await this.certModel.countDocuments({
        kindredId: k._id,
      });
      const idCardCount = await this.idCardModel.countDocuments({
        kindredId: k._id,
      });
      activity[`${k.firstname} ${k.lastname}`] = certCount + idCardCount;
    }

    return { activity };
  }

  /** 🕓 RECENT ACTIVITIES */
  async getRecentActivities(lgaOfOrigin: string) {
    const recentIdCards = await this.idCardModel.aggregate([
      {
        $addFields: {
          userIdObjectId: { $toObjectId: '$userId' },
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { userObjId: '$userIdObjectId' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$userObjId'] },
                lgaOfOrigin: lgaOfOrigin,
              },
            },
          ],
          as: 'user',
        },
      },
      {
        $match: {
          'user.0': { $exists: true }, // Check that user array has at least one element
        },
      },
      {
        $sort: { created_at: -1 },
      },
      {
        $limit: 5,
      },
      {
        $project: {
          firstname: 1,
          lastname: 1,
          created_at: 1,
          status: 1,
        },
      },
    ]);

    const recentCertificates = await this.certModel
      .find({ lgaOfOrigin })
      .sort({ created_at: -1 })
      .limit(5)
      .select('firstname lastname created_at status');

    const activities = [
      ...recentIdCards.map((r) => ({
        time: new Date(r.created_at).toLocaleString(),
        content: `${r.firstname} ${r.lastname} submitted an ID Card request (${r.status})`,
      })),
      ...recentCertificates.map((r) => ({
        time: new Date(r.created_at).toLocaleString(),
        content: `${r.firstname} ${r.lastname} made a Certificate request (${r.status})`,
      })),
    ].sort((a, b) => (a.time < b.time ? 1 : -1));

    return activities;
  }

  async getLgaRequestTrends(
    startDate?: string,
    endDate?: string,
  ): Promise<Record<string, number>> {
    // ====== START: ADD DATE FILTERING LOGIC ======
    // Create a filter object to be used in the database queries.
    const dateMatch: any = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {}; // Assuming you have a `createdAt` field
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }
    // --- Aggregate ID Card Requests by LGA ---
    const idCardAggregation = await this.idCardModel.aggregate([
      {
        $addFields: { userIdObjectId: { $toObjectId: '$userId' } },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $match: { 'user.lgaOfOrigin': { $ne: null }, ...dateMatch }, // <-- APPLY FILTER HERE
      },
      {
        $group: {
          _id: '$user.lgaOfOrigin',
          count: { $sum: 1 },
        },
      },
    ]);

    // --- Aggregate Certificate Requests by LGA ---
    const certAggregation = await this.certModel.aggregate([
      {
        $match: { lgaOfOrigin: { $ne: null }, ...dateMatch }, // <-- APPLY FILTER HERE
      },
      {
        $group: {
          _id: '$lgaOfOrigin',
          count: { $sum: 1 },
        },
      },
    ]);

    // --- Merge the results ---
    const lgaTrends: Record<string, number> = {};

    // Helper function to add counts to the main object
    const addCounts = (aggregation: any[]) => {
      aggregation.forEach((item) => {
        const lga = item._id;
        const count = item.count;
        if (lga) {
          // Ensure LGA is not null or undefined
          lgaTrends[lga] = (lgaTrends[lga] || 0) + count;
        }
      });
    };

    addCounts(idCardAggregation);
    addCounts(certAggregation);

    return lgaTrends;
  }

  async getDashboardData(user: any) {
    const userId = user.id;

    // Fetch the current user
    const userDoc = await this.userModel.findById(userId).lean();
    if (!userDoc) throw new Error('User not found');

    // Fetch all ID card requests for this user (irrespective of state)
    const idcardRequests = await this.idCardModel.find({ userId }).lean();

    // Fetch certificate requests ONLY if user is a Benue State indigene
    let certificateRequests = [];
    if (
      userDoc.stateOfOrigin &&
      userDoc.stateOfOrigin.toLowerCase() === 'benue'
    ) {
      certificateRequests = await this.certModel.find({ userId }).lean();
    }

    // Combine both types
    const allRequests = [
      ...idcardRequests.map((r) => ({ ...r, created: r.created_at })),
      ...certificateRequests.map((r) => ({ ...r, created: r.createdAt })),
    ];

    // Calculate statistics
    const totalRequests = idcardRequests.length + certificateRequests.length;
    const approvedRequests =
      idcardRequests.filter((r) => r.status === 'Approved').length +
      certificateRequests.filter((r) => r.status === 'Approved').length;
    const pendingRequests =
      idcardRequests.filter((r) => r.status === 'Pending').length +
      certificateRequests.filter((r) => r.status === 'Pending').length;
    const rejectedRequests =
      idcardRequests.filter((r) => r.status === 'Rejected').length +
      certificateRequests.filter((r) => r.status === 'Rejected').length;

    // ✅ Compute total ID card & certificate requests by month (for charts)
    const groupByMonth = (requests, dateKey) => {
      const months = Array.from({ length: 12 }, (_, i) =>
        new Date(0, i).toLocaleString('default', { month: 'short' }),
      );
      const counts = Object.fromEntries(months.map((m) => [m, 0]));

      requests.forEach((req) => {
        const date = new Date(req[dateKey]);
        if (!isNaN(date.getTime())) {
          const month = date.toLocaleString('default', { month: 'short' });
          counts[month] = (counts[month] || 0) + 1;
        }
      });
      return counts;
    };

    // --- Helpers ---
    const groupByDay = (requests) => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const counts = Object.fromEntries(days.map((d) => [d, 0]));
      requests.forEach((r) => {
        const date = new Date(r.created);
        if (!isNaN(date.getTime())) counts[days[date.getDay()]]++;
      });
      return counts;
    };

    const groupByHour = (requests) => {
      const hours = Array.from(
        { length: 24 },
        (_, i) => i.toString().padStart(2, '0') + ':00',
      );
      const counts = Object.fromEntries(hours.map((h) => [h, 0]));
      requests.forEach((r) => {
        const date = new Date(r.created);
        if (!isNaN(date.getTime())) {
          const hour = date.getHours().toString().padStart(2, '0') + ':00';
          counts[hour]++;
        }
      });
      return counts;
    };

    // --- Group by day and hour ---
    const byDay = groupByDay(allRequests);
    const byHour = groupByHour(allRequests);

    // ✅ Combine into a single unified object
    const combinedFrequency = {
      ...byDay,
      // ...byHour, // hour keys come after days — order preserved when iterating
    };

    const idcardByMonth = groupByMonth(idcardRequests, 'created_at');
    const certificateByMonth = groupByMonth(certificateRequests, 'created_at');

    // Activity timeline (recent actions)
    const activityData = [
      ...idcardRequests.map((r) => ({
        time: r.created_at,
        content: `You submitted an ID card request for ${r.firstname || 'your household'}.`,
      })),
      ...certificateRequests.map((r) => ({
        time: r.createdAt,
        content: `You submitted a certificate request for ${r.kindred || 'your household'}.`,
      })),
    ]
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);

    // Fetch unread notifications
    const [notifications, unreadCount] = await Promise.all([
      this.notificationsService.getUserNotifications(userId),
      this.notificationsService.getUnreadCount(userId),
    ]);

    // Prepare analytics for the frontend charts
    const analytics = {
      requestStatus: {
        Approved: approvedRequests,
        Pending: pendingRequests,
        Rejected: rejectedRequests,
      },
      requestFrequency: {
        IDCard: idcardRequests.length,
        Certificate: certificateRequests.length,
      },

      // ✅ New monthly breakdowns for charts
      idcardRequests: idcardByMonth,
      certificateRequests: certificateByMonth,

      requestByDayAndHour: combinedFrequency,
    };

    // Return consistent format for frontend
    return {
      analytics,
      activity: activityData,
      summary: {
        totalRequests,
        approvedRequests,
        pendingRequests,
        profileCompletionPercentage: userDoc.profileCompletionPercentage || 0,
        notifications,
        unreadCount,
      },
    };
  }

  /**
   * Generates a PDF report of the dashboard.
   */
  async generateDashboardPdfReport(
    startDate?: string,
    endDate?: string,
  ): Promise<Buffer> {
    const stats = await this.getDashboardStats(startDate, endDate);

    const doc = new PDFDocument({ margin: 50 });
    const buffers: Buffer[] = [];
    doc.on('data', buffers.push.bind(buffers));

    // --- Add Content to PDF ---
    doc.fontSize(20).text('Dashboard Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`);
    if (startDate || endDate) {
      doc.text(
        `For period: ${startDate || 'the beginning'} to ${endDate || 'now'}`,
      );
    }
    doc.moveDown(2);

    // --- KPIs ---
    doc.fontSize(14).text('Key Performance Indicators', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Total Registered Users: ${stats.totalUsers}`);
    doc.text(`Active Users: ${stats.activeUsers}`);
    doc.moveDown(2);

    // --- Recent Activity Table ---
    doc.fontSize(14).text('Recent Activity', { underline: true });
    doc.moveDown(1);
    const tableTop = doc.y;
    const headers = ['Time', 'User', 'Action'];
    const rowHeight = 20;
    const columnWidths = [80, 100, 300];
    let yPosition = tableTop;

    // Draw headers
    headers.forEach((header, i) => {
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(
          header,
          50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
          yPosition,
          { width: columnWidths[i] },
        );
    });
    doc
      .moveTo(50, yPosition + 12)
      .lineTo(530, yPosition + 12)
      .stroke();
    yPosition += rowHeight;

    // Draw rows
    doc.font('Helvetica').fontSize(9);
    stats.recentActivities.forEach((activity) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Safely determine a display name for different activity shapes
      const displayName =
        (activity as any).name ??
        (activity as any).ref ??
        (activity as any).type ??
        '';

      const row = [
        new Date((activity as any).createdAt).toLocaleString(),
        displayName,
        `${(activity as any).type} - ${(activity as any).status}`,
      ];
      row.forEach((text, i) => {
        doc.text(
          String(text),
          50 + columnWidths.slice(0, i).reduce((a, b) => a + b, 0),
          yPosition,
          { width: columnWidths[i] },
        );
      });
      yPosition += rowHeight;
    });

    doc.end();
    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
    });
  }

  async getFullAnalyticsData(
    lga?: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateMatch = this.getDateMatch(startDate, endDate);
    const lgaMatch = lga ? { lgaOfOrigin: lga } : {};

    // --- Demographics (Corrected Logic) ---
    // 1. Get Gender Distribution
    const genderDistribution = await this.userModel.aggregate([
      {
        $match: { ...lgaMatch, gender: { $exists: true, $nin: [null, ''] } },
      },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
    ]);

    // 2. Get Age Distribution
    const ageDistribution = await this.userModel.aggregate([
      { $match: { ...lgaMatch, DOB: { $exists: true, $ne: '' } } },
      {
        $addFields: {
          dateOfBirth: {
            $dateFromString: { dateString: '$DOB', onError: null },
          },
        },
      },
      { $match: { dateOfBirth: { $ne: null } } },
      {
        $addFields: {
          age: {
            $dateDiff: {
              startDate: '$dateOfBirth',
              endDate: '$$NOW',
              unit: 'year',
            },
          },
        },
      },
      {
        $bucket: {
          groupBy: '$age',
          boundaries: [0, 18, 26, 36, 51, 100],
          default: 'Other',
          output: { count: { $sum: 1 } },
        },
      },
    ]);

    const demographicsData = {
      gender: genderDistribution,
      age: ageDistribution,
    };

    // --- Trends (ID card related) ---
    // Note: dateMatch is based on createdAt, ensure idCardModel has this field.
    const trends = await this.idCardModel.aggregate([
      { $match: { ...dateMatch } }, // Filter idCardModel first
      { $addFields: { userIdObjectId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { ...lgaMatch } }, // Then filter by user's field
      { $group: { _id: { $month: '$created_at' }, count: { $sum: 1 } } },
    ]);

    // --- Transactions ---
    const transactions = await this.transModel.aggregate([
      { $match: { status: 'success', ...dateMatch } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // --- LGA Trends ---
    // Note: dateMatch is applied to certModel, ensure it has a createdAt field.
    const lgaTrends = await this.certModel.aggregate([
      { $match: { ...dateMatch } }, // Filter certModel first
      { $addFields: { userIdObjectId: { $toObjectId: '$userId' } } },
      {
        $lookup: {
          from: 'users',
          localField: 'userIdObjectId',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      { $match: { 'user.lgaOfOrigin': lga } }, // Get lga from the joined user document
      { $group: { _id: '$user.lgaOfOrigin', count: { $sum: 1 } } },
    ]);

    // --- Helper: process transactions for monthly chart ---
    const processTransactionsForMonthlyChart = (transactions: any[]) => {
      const monthlyTotals: Record<string, number> = {};
      transactions.forEach((t) => {
        const month = t._id.substring(0, 7); // 'YYYY-MM'
        monthlyTotals[month] =
          (monthlyTotals[month] || 0) + (t.totalAmount || 0);
      });
      return monthlyTotals;
    };

    // --- Return formatted data ---
    return {
      demographics: this.formatDemographics(demographicsData),
      trends: this.formatTrends(trends),
      transactions: processTransactionsForMonthlyChart(transactions),
      lgaTrends: this.formatLgaTrends(lgaTrends),
    };
  }

  // --- ✅ Helper to get date match ---
  private getDateMatch(startDate?: string, endDate?: string) {
    const dateMatch: any = {};

    if (startDate || endDate) {
      dateMatch.createdAt = {};
      if (startDate) dateMatch.createdAt.$gte = new Date(startDate);
      if (endDate) dateMatch.createdAt.$lte = new Date(endDate);
    }

    return dateMatch;
  }

  private formatDemographics(data: { gender: any[]; age: any[] }) {
    const genderDist: Record<string, number> = { Male: 0, Female: 0 };
    const ageDist: Record<string, number> = {
      'Under 18': 0,
      '18-25': 0,
      '26-35': 0,
      '36-50': 0,
      '51+': 0,
    };

    // Process gender data
    data.gender.forEach((item) => {
      const gender = item._id.toLowerCase();
      if (gender === 'male') genderDist.Male += item.count;
      else if (gender === 'female') genderDist.Female += item.count;
    });

    // Process age data
    data.age.forEach((item) => {
      // _id is the lower bound of the age range, e.g., 0, 18, 26...
      const ageLowerBound = item._id;
      if (ageLowerBound < 18) ageDist['Under 18'] += item.count;
      else if (ageLowerBound >= 18 && ageLowerBound < 26)
        ageDist['18-25'] += item.count;
      else if (ageLowerBound >= 26 && ageLowerBound < 36)
        ageDist['26-35'] += item.count;
      else if (ageLowerBound >= 36 && ageLowerBound < 51)
        ageDist['36-50'] += item.count;
      else if (ageLowerBound >= 51) ageDist['51+'] += item.count;
    });

    // The logic for combinedGroups would also need to be adjusted based on requirements.
    // For now, keeping the original structure.
    const combinedGroups: Record<string, number> = {
      'Male 18-35': 0,
      'Female 18-35': 0,
      'Male 36+': 0,
      'Female 36+': 0,
    };

    return {
      genderDistribution: {
        labels: Object.keys(genderDist),
        values: Object.values(genderDist),
      },
      ageDistribution: {
        labels: Object.keys(ageDist),
        values: Object.values(ageDist),
      },
      combinedGroups: {
        labels: Object.keys(combinedGroups),
        values: Object.values(combinedGroups),
      },
    };
  }

  private formatTrends(trends: any[]) {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];
    const idCardRequests = months.map((_, i) => {
      const monthNumber = i + 1;
      const found = trends.find((x) => x._id === monthNumber);
      return found ? found.count : 0;
    });
    const certRequests = months.map((_, i) => {
      const monthNumber = i + 1;
      const found = trends.find((x) => x._id === monthNumber);
      return found ? found.count : 0;
    });

    const dailyLabels = [...new Set(trends.map((t) => t._id))].sort();
    const idCardMap = new Map(trends.map((t) => [t._id, t.count]));
    const certMap = new Map(trends.map((t) => [t._id, t.count]));

    // Build hourly defaults (24 slots). If hourly data is later provided in a different shape,
    // this can be adapted to merge real hourly values into these arrays.
    const hourLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const idCardHourly = Array.from({ length: 24 }, () => 0);
    const certHourly = Array.from({ length: 24 }, () => 0);

    return {
      monthly: { labels: months, idCardRequests, certRequests },
      daily: {
        labels: dailyLabels,
        idCardRequests: dailyLabels.map((label) => idCardMap.get(label) || 0),
        certificateRequests: dailyLabels.map(
          (label) => certMap.get(label) || 0,
        ),
      },
      hourly: {
        labels: hourLabels,
        idCardRequests: idCardHourly,
        certificateRequests: certHourly,
      },
    };
  }

  private formatLgaTrends(items: any[]) {
    const result: Record<string, number> = {};
    items.forEach((item) => {
      const lga = item._id;
      const count = item.count;
      if (lga) {
        result[lga] = (result[lga] || 0) + count;
      }
    });
    return result;
  }

  async findUserWithPermissions(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rolePermission = await this.rolePermissionModel
      .findOne({ role: user.role })
      .exec();

    return {
      ...user.toObject(),
      permissions: rolePermission ? rolePermission.permissions : [],
    };
  }

  async updateUserRole(
    userId: string,
    newRole: UserRole,
    assignedBy: string,
    reason: string,
  ) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const previousRole = user.role;

    // Create role assignment record
    await this.roleAssignmentService.createAssignment(
      userId,
      previousRole,
      newRole,
      assignedBy,
      reason,
    );

    // Update user role
    user.role = newRole;
    // Ensure assignedBy is stored as an ObjectId
    user.assignedBy = new Types.ObjectId(assignedBy);
    await user.save();

    return user;
  }
}
