import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { comparePassword, hashPassword } from './auth';
import { LoginCredentialsException } from 'src/common/exception';
import {
  ActivateParams,
  ChangePasswordDto,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
  Verify2FADto,
} from './auth.interface';
import { Model } from 'mongoose';
import { UserMailerService } from 'src/users/users.mailer.service';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuid } from 'uuid';
import config from 'src/config';
import { SigUpKindredDto } from 'src/kindred/kindredDto';
import { KindredService } from 'src/kindred/kindred.service';
import { UserPublicData } from 'src/users/users.dto';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) public readonly userModel: Model<User>,
    private readonly userMailer: UserMailerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly kindredService: KindredService,
  ) {}

  private fakeDatabase = {
    '12345678901': {
      firstname: 'Godfrey',
      lastname: 'Ejeh',
      stateOfOrigin: 'Benue',
      lga: 'Ogbadibo',
      status: 'verified',
    },
    '98765432109': {
      firstname: 'John',
      lastname: 'Doe',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },
    '98765432102': {
      firstname: 'Simon',
      lastname: 'Iber',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },
    '98765432162': {
      firstname: 'Sheyi',
      lastname: 'Shay',
      stateOfOrigin: 'Ogun',
      lga: 'Ifo',
      status: 'verified',
    },
    '88765432102': {
      firstname: 'Arome',
      lastname: 'Mbur',
      stateOfOrigin: 'Kogi',
      lga: 'Okene',
      status: 'verified',
    },

    '88765432105': {
      firstname: 'Derick',
      lastname: 'Gbaden',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },

    '88765432101': {
      firstname: 'Charles',
      lastname: 'Luper',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },
    '88765432131': {
      firstname: 'Victor',
      lastname: 'Atir',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },
    '88765432133': {
      firstname: 'Akor',
      lastname: 'Ejeh',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },

    '88765432103': {
      firstname: 'James',
      lastname: 'Gbaden',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },

    '88765432111': {
      firstname: 'Gabriel',
      lastname: 'Nwaje',
      stateOfOrigin: 'Enugu',
      lga: 'Nsuka',
      status: 'verified',
    },
  };

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
    const { NIN, firstname, lastname, stateOfOrigin } = userData;

    if (!this.fakeDatabase[NIN]) {
      throw new BadRequestException('NIN not found');
    }

    const storedData = this.fakeDatabase[NIN];
    if (
      storedData.firstname !== firstname ||
      storedData.lastname !== lastname ||
      storedData.stateOfOrigin.toLocaleLowerCase() !==
        stateOfOrigin.toLocaleLowerCase()
    ) {
      throw new BadRequestException('User details do not match the NIN record');
    }
    const user = await this.usersService.create(
      userData.firstname,
      userData.lastname,
      userData.email,
      userData.password,
      userData.phone,
      userData.stateOfOrigin,
      userData.lgaOfOrigin,
      userData.NIN,
      userData.kindred,
      role,
      origin,
    );
    return {
      token: this.jwtService.sign(
        { ...user.getPublicData() },
        { subject: `${user.id}` },
      ),
      user: user.getPublicData(),
      success: true,
      message: 'NIN Verified Successfully',
    };
  }

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

  async loginKindred(user?: User) {
    if (user.role == 'kindred_head') {
      return {
        token: this.jwtService.sign(
          //@ts-ignore
          { ...user?.getPublicData() },
          //@ts-ignore
          { subject: `${user?.id}` },
        ),
        //@ts-ignore
        user: user?.getPublicData(),
      };
    }

    throw new UnauthorizedException(
      'Account does not support kindred activities.',
    );
  }

  async forgottenPassword({ email }: ForgottenPasswordDto, origin: string) {
    return await this.usersService.forgottenPassword(email, origin);
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
    token: string,
  ): Promise<{ token: string; user: UserPublicData }> {
    const { email, password } = resetPasswordDto;

    const user = await this.usersService.resetPassword(email, token, password);

    return {
      token: this.jwtService.sign({}, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }

  async changePassword(
    userId: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!comparePassword(currentPassword, user.password)) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    await this.userModel.updateOne(
      { _id: userId },
      { $set: { password: await hashPassword(newPassword) } },
    );
  }

  // Add this method to get user by ID
  async getUserById(userId: string): Promise<UserDocument> {
    try {
      const user = (await this.userModel.findById(userId)) as UserDocument;

      if (!user) {
        console.error(`User not found with ID: ${userId}`);
        throw new UnauthorizedException('User not found');
      }

      console.log(
        `User found: ${user.email}, 2FA enabled: ${user.twoFactorEnabled}`,
      );
      return user;
    } catch (error) {
      console.error(`Error fetching user with ID ${userId}:`, error);
      throw error;
    }
  }

  // async generate2FASecret(
  //   userId: string,
  // ): Promise<{ secret: string; qrCodeUrl: string }> {
  //   const user = await this.userModel.findById(userId);
  //   if (!user) {
  //     throw new UnauthorizedException('User not found');
  //   }

  //   const secret = authenticator.generateSecret();
  //   const appName = 'YourAppName';
  //   const qrCodeUrl = authenticator.keyuri(user.email, appName, secret);

  //   // Store the secret temporarily (not enabled yet)
  //   await this.userModel.updateOne(
  //     { _id: userId },
  //     { $set: { twoFactorSecret: secret } },
  //   );

  //   return { secret, qrCodeUrl };
  // }

  // src/auth/auth.service.ts
  async generate2FASecret(
    userId: string,
  ): Promise<{ secret: string; qrCodeUrl: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const secret = authenticator.generateSecret();
    const appName = 'benueId';
    const qrCodeUrl = authenticator.keyuri(user.email, appName, secret);

    try {
      // Store the secret temporarily (not enabled yet)
      const updateResult = await this.userModel.updateOne(
        { _id: userId },
        { $set: { twoFactorSecret: secret } },
      );
      // Verify the update was successful
      if (updateResult.modifiedCount === 0) {
        throw new Error('Failed to update user with 2FA secret');
      }

      return { secret, qrCodeUrl };
    } catch (error) {
      console.error('Error storing 2FA secret:', error);
      throw new BadRequestException('Failed to setup 2FA');
    }
  }

  async verify2FA(
    userId: string,
    verify2FADto: Verify2FADto,
  ): Promise<boolean> {
    const { code } = verify2FADto;

    const user = await this.userModel.findById(userId);

    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not initiated');
    }

    // Add this debugging line
    const currentTime = Math.floor(Date.now() / 1000);
    // Try to verify with more detailed logging
    try {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        // Let's try to generate a valid code for comparison
        const validCode = authenticator.generate(user.twoFactorSecret);
        console.log('Valid code should be:', validCode);

        throw new BadRequestException('Invalid verification code');
      }

      return true;
    } catch (error) {
      console.error('Error during 2FA verification:', error);
      throw error;
    }

    return true;
  }

  async enable2FA(userId: string): Promise<{ backupCodes: string[] }> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA setup not completed');
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase(),
    );

    // Enable 2FA and save backup codes
    await this.userModel.updateOne(
      { _id: userId },
      {
        $set: {
          twoFactorEnabled: true,
          backupCodes: backupCodes.map((code) => bcrypt.hashSync(code, 10)),
        },
      },
    );

    return { backupCodes };
  }

  async disable2FA(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      {
        $unset: {
          twoFactorSecret: 1,
          backupCodes: 1,
        },
        $set: { twoFactorEnabled: false },
      },
    );
  }

  async validateBackupCode(userId: string, code: string): Promise<boolean> {
    const user = await this.userModel.findById(userId);
    if (!user || !user.backupCodes || user.backupCodes.length === 0) {
      return false;
    }

    for (const hashedCode of user.backupCodes) {
      if (await bcrypt.compare(code, hashedCode)) {
        // Remove the used backup code
        await this.userModel.updateOne(
          { _id: userId },
          { $pull: { backupCodes: hashedCode } },
        );
        return true;
      }
    }

    return false;
  }
}
