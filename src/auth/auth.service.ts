import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { comparePassword, hashPassword } from './auth';
import { LoginCredentialsException } from 'src/common/exception';
import {
  ActivateParams,
  AdminSignUpDto,
  ChangePasswordDto,
  ForgottenPasswordDto,
  Login2FADto,
  ResetPasswordDto,
  SignUpDto,
  Verify2FADto,
} from './auth.interface';
import { Model } from 'mongoose';
import { UserMailerService } from 'src/users/users.mailer.service';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuid } from 'uuid';
import config from 'src/config';
import { UserPublicData } from 'src/users/users.dto';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';

authenticator.options = { window: 1 };
import { MailService } from 'src/mail/mail.service';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly baseUrl = 'https://api.qoreid.com';

  constructor(
    // @InjectModel(User.name) public readonly userModel: Model<User>,
    @InjectModel(User.name) public readonly userModel: Model<UserDocument>,
    private readonly userMailer: UserMailerService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  private fakeDatabase = {
    '12345678901': {
      firstname: 'Godfrey',
      lastname: 'Ejeh',
      middlename: 'Akor',
      stateOfOrigin: 'Benue',
      lga: 'Ogbadibo',
      status: 'verified',
    },
    '98765432109': {
      firstname: 'John',
      lastname: 'Doe',
      middlename: 'Smith',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },
    '98765432102': {
      firstname: 'Simon',
      lastname: 'Iber',
      middlename: 'Akper',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },
    '98765432162': {
      firstname: 'Sheyi',
      lastname: 'Shay',
      middlename: 'Oladele',
      stateOfOrigin: 'Ogun',
      lga: 'Ifo',
      status: 'verified',
    },
    '88765432102': {
      firstname: 'Arome',
      lastname: 'Mbur',
      middlename: 'Idris',
      stateOfOrigin: 'Kogi',
      lga: 'Okene',
      status: 'verified',
    },

    '88765432105': {
      firstname: 'Derick',
      lastname: 'Gbaden',
      middlename: 'Godwin',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },

    '88765432101': {
      firstname: 'Charles',
      lastname: 'Luper',
      middlename: 'Tersoo',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },
    '88765432131': {
      firstname: 'Victor',
      lastname: 'Atir',
      middlename: 'James',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },
    '88765432133': {
      firstname: 'Akor',
      lastname: 'Ejeh',
      middlename: 'Godfrey',
      stateOfOrigin: 'Benue',
      lga: 'Gboko',
      status: 'verified',
    },

    '88765432103': {
      firstname: 'James',
      lastname: 'Gbaden',
      middlename: 'Derick',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },

    '88765432111': {
      firstname: 'Gabriel',
      lastname: 'Nwaje',
      middlename: 'Sunday',
      stateOfOrigin: 'Enugu',
      lga: 'Nsukka',
      status: 'verified',
    },

    '88765432456': {
      firstname: 'Adrian',
      lastname: 'Idoko',
      stateOfOrigin: 'Delta',
      lga: 'Ughelli North',
      status: 'verified',
    },

    '18765432103': {
      firstname: 'Mary',
      lastname: 'Jane',
      middlename: 'Doe',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
      status: 'verified',
    },

    '33765432103': {
      firstname: 'Japheth',
      lastname: 'Kor',
      middlename: 'Tersoo',
      stateOfOrigin: 'Benue',
      lga: 'Gwer East',
      status: 'verified',
    },

    '33765432155': {
      firstname: 'Steven',
      lastname: 'Ajiga',
      middlename: 'Ajene',
      stateOfOrigin: 'Benue',
      lga: 'Oju',
      status: 'verified',
    },

    '24765432155': {
      firstname: 'Joseph',
      lastname: 'Agbo',
      middlename: 'Suleman',
      stateOfOrigin: 'Benue',
      lga: 'Apa',
      status: 'verified',
    },

    '24768432155': {
      firstname: 'Terrence',
      lastname: 'Terkula',
      middlename: 'Terkimbi',
      stateOfOrigin: 'Benue',
      lga: 'Gwer West',
      status: 'verified',
    },
    '34768432156': {
      firstname: 'Luke',
      lastname: 'Terkula',
      middlename: 'Terkimbi',
      stateOfOrigin: 'Benue',
      lga: 'Buruku',
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
    this.mailService.sendActivationMail(
      user.email,
      user.id,
      user.activationToken,
      origin,
    );

    return { success: true, message: 'Activation email sent successfully' };
  }

  // async signupUser(userData: SignUpDto, origin: string, role: string) {
  //   const { NIN, firstname, lastname, stateOfOrigin } = userData;

  //   if (!this.fakeDatabase[NIN]) {
  //     throw new BadRequestException('NIN not found');
  //   }

  //   const storedData = this.fakeDatabase[NIN];
  //   if (
  //     storedData.firstname !== firstname ||
  //     storedData.lastname !== lastname ||
  //     storedData.stateOfOrigin.toLocaleLowerCase() !==
  //       stateOfOrigin.toLocaleLowerCase()
  //   ) {
  //     throw new BadRequestException('User details do not match the NIN record');
  //   }
  //   const user = await this.usersService.create(
  //     userData.firstname,
  //     userData.middlename,
  //     userData.lastname,
  //     userData.DOB,
  //     userData.email,
  //     userData.password,
  //     userData.phone,
  //     userData.stateOfOrigin,
  //     userData.lgaOfOrigin,
  //     userData.NIN,
  //     role,
  //     origin,
  //   );
  //   return {
  //     token: this.jwtService.sign(
  //       { ...user.getPublicData() },
  //       { subject: `${user.id}` },
  //     ),
  //     user: user.getPublicData(),
  //     success: true,
  //     message: 'NIN Verified Successfully',
  //   };
  // }

  async signupUser(userData: SignUpDto, origin: string, role: string) {
    const { NIN, firstname, lastname, stateOfOrigin } = userData;

    // 1️⃣ Basic NIN format validation
    if (!NIN || NIN.length !== 11) {
      throw new BadRequestException('Invalid NIN format');
    }

    // 2️⃣ Prevent duplicate NIN registration
    const existingUser = await this.usersService.findByNIN(NIN);
    if (existingUser) {
      throw new BadRequestException('This NIN is already registered');
    }

    // 3️⃣ Verify NIN with QoreId
    const verification = await this.verifyNIN(NIN, firstname, lastname);
    if (!verification || !verification.status) {
      throw new BadRequestException('NIN verification failed');
    }

    const verifiedData = verification?.nin;
    // 4️⃣ Match user-submitted data with verified record
    if (
      verifiedData?.firstname?.toLowerCase() !== firstname.toLowerCase() ||
      verifiedData?.lastname?.toLowerCase() !== lastname.toLowerCase() ||
      verifiedData?.state_of_origin?.toLowerCase() !==
        stateOfOrigin.toLowerCase()
    ) {
      throw new BadRequestException('User details do not match the NIN record');
    }
    const user = await this.usersService.create(
      userData.firstname,
      userData.middlename,
      userData.lastname,
      userData.DOB,
      userData.email,
      userData.password,
      userData.phone,
      userData.stateOfOrigin,
      userData.lgaOfOrigin,
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
      success: true,
      message: 'NIN Verified Successfully',
    };
  }

  async adminSignup(userData: AdminSignUpDto, origin: string, role: string) {
    const { NIN, firstname, lastname, stateOfOrigin, phone, email } = userData;

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

    // 🔐 Auto-generate password from phone
    const generatedPassword = phone.toString().slice(-8);
    // Example: phone = '08034567890' → password = '567890'

    const user = await this.usersService.createUser(
      firstname,
      userData.middlename,
      lastname,
      userData.DOB,
      email,
      generatedPassword, // pass auto-generated password
      phone,
      stateOfOrigin,
      userData.lgaOfOrigin,
      NIN,
      role,
      origin,
    );

    // 📧 Send welcome email with password
    await this.mailService.sendWelcomePasswordEmail(email, generatedPassword);

    return {
      token: this.jwtService.sign(
        { ...user.getPublicData() },
        { subject: `${user.id}` },
      ),
      user: user.getPublicData(),
      success: true,
      message: 'User created successfully',
    };
  }

  async login(user?: any) {
    if (!user.isActive) {
      throw new UnauthorizedException(
        'Account is not activated. Please check your email for activation instructions.',
      );
    }

    if (user.twoFactorEnabled) {
      const tempToken = this.jwtService.sign(
        { id: user.id, purpose: '2fa' },
        { subject: `${user.id}`, expiresIn: '5m' },
      );
      return {
        requires2FA: true,
        tempToken,
        message: 'Please provide your 2FA code',
      };
    }

    return {
      token: this.jwtService.sign(
        { ...user?.getPublicData() },
        { subject: `${user?.id}` },
      ),
      user: user?.getPublicData(),
    };
  }

  async complete2FALogin(
    login2FADto: Login2FADto,
  ): Promise<{ token: string; user: UserPublicData }> {
    const { tempToken, code } = login2FADto;

    let payload: any;
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired token. Please log in again.',
      );
    }

    if (payload.purpose !== '2fa') {
      throw new UnauthorizedException('Invalid token purpose');
    }

    const userId = payload.id || payload.sub;
    const user = await this.userModel.findById(userId);
    if (!user || !user.twoFactorSecret) {
      throw new UnauthorizedException('User not found or 2FA not configured');
    }

    // Check if code is a backup code first (flexible length)
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      const isValidBackup = await this.validateBackupCode(userId, code);
      if (isValidBackup) {
        return {
          token: this.jwtService.sign(
            { ...user.getPublicData() },
            { subject: `${user.id}` },
          ),
          user: user.getPublicData(),
        };
      }
      throw new UnauthorizedException('Invalid 2FA code');
    }

    // Verify TOTP code with clock tolerance for server/app time drift
    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    return {
      token: this.jwtService.sign(
        { ...user.getPublicData() },
        { subject: `${user.id}` },
      ),
      user: user.getPublicData(),
    };
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

    try {
      const isValid = authenticator.verify({
        token: code,
        secret: user.twoFactorSecret,
      });

      if (!isValid) {
        throw new BadRequestException('Invalid verification code');
      }

      return true;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('2FA verification failed');
    }
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

  /**
   * Checks for the existence of a user based on provided identifiers (email, phone, NIN).
   * @param identifiers An object containing one or more identifiers to check.
   * @returns An object indicating the existence status for each provided identifier.
   */
  async checkUserExistence(identifiers: {
    email?: string;
    phone?: string;
    nin?: string;
  }): Promise<{ email?: boolean; phone?: boolean; nin?: boolean }> {
    const results: { email?: boolean; phone?: boolean; nin?: boolean } = {};
    const promises: Promise<UserDocument | null>[] = [];
    const fields: ('email' | 'phone' | 'nin')[] = [];

    if (identifiers.email) {
      promises.push(
        this.userModel.findOne({ email: identifiers.email }).exec(),
      );
      fields.push('email');
    }
    // Assuming the 'phone' field exists in the User model
    if (identifiers.phone) {
      promises.push(
        this.userModel.findOne({ phone: identifiers.phone }).exec(),
      );
      fields.push('phone');
    }
    // Assuming the 'NIN' field exists in the User model
    if (identifiers.nin) {
      promises.push(this.userModel.findOne({ NIN: identifiers.nin }).exec());
      fields.push('nin');
    }

    if (promises.length === 0) {
      return {}; // Should be caught by controller's BadRequestException, but for safety
    }

    const dbResults = await Promise.all(promises);

    // Map the database results back to the original fields
    dbResults.forEach((user, index) => {
      const field = fields[index];
      results[field] = !!user;
    });

    return results;
  }

  // async verifyNIN(nin: string) {
  //   try {
  //     const response = await axios.post(
  //       // 'https://echoverify.ng/api/v1/verify',
  //       'https://api.qoreid.com/v1/ng/identities/nin/{idNumber}',
  //       {
  //         product_slug: 'nin-verification',
  //         payload: {
  //           id: nin, // EchoVerify expects `id`, not `nin`
  //           isSubjectConsent: true, // true if you have consent
  //         },
  //       },
  //       {
  //         headers: {
  //           'X-API-Key': process.env.ECHOVERIFY_API_KEY, // EchoVerify API key
  //           'X-Environment': 'test', // or "live"
  //           'Content-Type': 'application/json',
  //         },
  //       },
  //     );

  //     return response.data;
  //   } catch (error: any) {
  //     console.error(
  //       'EchoVerify NIN verification error:',
  //       error.response?.data || error.message,
  //     );

  //     throw new BadRequestException(
  //       error.response?.data?.message ||
  //         'NIN verification failed. Please check the NIN and try again.',
  //     );
  //   }
  // }

  async getQoreIdToken() {
    const response = await axios.post('https://api.qoreid.com/token', {
      clientId: process.env.Test_Client_ID,
      secret: process.env.Test_Secret_Key,
    });

    return response.data.accessToken;
  }

  async verifyNIN(nin: string, firstName: string, lastName: string) {
    const token = await this.getQoreIdToken();

    try {
      const response = await axios.post(
        // `${this.baseUrl}/v1/ng/identities/nin-premium/${nin}`,
        `${this.baseUrl}/v1/ng/identities/nin/${nin}`,
        {
          firstname: firstName,
          lastname: lastName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      console.log('QoreId NIN verification response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error(
        'QoreId NIN verification error:',
        error.response?.data || error.message,
      );
      throw error.response?.data || error.message;
    }
  }
}
