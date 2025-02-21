import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { comparePassword } from './auth';
import { LoginCredentialsException } from 'src/common/exception';
import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
} from './auth.interface';
import { Model } from 'mongoose';
import { UserMailerService } from 'src/users/users.mailer.service';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuid } from 'uuid';
import config from 'src/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) public readonly userModel: Model<User>,
    private readonly userMailer: UserMailerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.usersService.findByEmail(email);

    if (!comparePassword(password, user.password)) {
      throw LoginCredentialsException();
    }
    return user;
  }

  async activate({ userId, activationToken }: ActivateParams) {
    const user = await this.usersService.activate(userId, activationToken);
    if (!user) {
      return { success: false, message: 'Invalid or expired token' };
    }

    return {
      success: true,
      message: 'Account activated successfully',
      token: this.jwtService.sign({ id: user.id }, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }

  async resendActivationEmail(email: string, origin: string) {
    const user = await this.userModel.findOne({ email });
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (user.isActive) {
      return { success: false, message: 'Account is already activated' };
    }

    // Generate a new activation token (or reuse the old one)
    const activationToken = user.activationToken || uuid();
    user.activationToken = activationToken;
    (user.activationExpires = new Date(
      Date.now() + config.auth.activationExpireInMs,
    )),
      await user.save();

    // Send email with activation link
    this.userMailer.sendActivationMail(
      user.email,
      user.id,
      user.activationToken,
      origin,
    );

    return { success: true, message: 'Activation email sent successfully' };
  }

  async signUpUser(userData: SignUpDto, origin: string, role: string) {
    const user = await this.usersService.create(
      userData.firstname,
      userData.lastname,
      userData.email,
      userData.password,
      userData.phone,
      userData.NIN,
      role,
      origin,
    );
    return {
      token: this.jwtService.sign(
        { ...user.getPublicData() },
        { subject: `${user.id}` },
      ),
      user: user.getPublicData(),
    };
  }

  // user jwt decode obj
  async login(user?: any) {
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is not activated. Please check your email for activation instructions.',
      );
    }
    return {
      token: this.jwtService.sign(
        { ...user?.getPublicData() },
        { subject: `${user?.id}` },
      ),
      user: user?.getPublicData(),
    };
  }

  async forgottenPassword({ email }: ForgottenPasswordDto, origin: string) {
    return await this.usersService.forgottenPassword(email, origin);
  }

  async resetPassword({
    email,
    passwordResetToken,
    password,
  }: ResetPasswordDto) {
    const user = await this.usersService.resetPassword(
      email,
      passwordResetToken,
      password,
    );

    return {
      token: this.jwtService.sign({}, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }
}
