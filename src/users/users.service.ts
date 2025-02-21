import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserDocument } from './users.schema';
import { Model } from 'mongoose';
import { hashPassword } from 'src/auth/auth';
import { v4 as uuid } from 'uuid';
import config from 'src/config';
import { UserMailerService } from './users.mailer.service';
import {
  ActivationTokenInvalidException,
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  UserNotFoundException,
} from 'src/common/exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('User') public readonly userModel: Model<UserDocument>,
    private readonly userMailer: UserMailerService,
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

    // Send email with activation link
    //  await this.mailerService.sendMail({
    //    to: user.email,
    //    subject: 'Activate Your Account',
    //    html: `<p>Click <a href="http://yourdomain.com/auth/activate?token=${activationToken}">here</a> to activate your account.</p>`,
    //  });

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
    password: string,
  ) {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          email: email.toLowerCase(),
          passwordResetToken,
        },
        {
          password: await hashPassword(password),
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
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
}
