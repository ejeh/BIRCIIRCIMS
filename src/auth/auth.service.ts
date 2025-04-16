import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
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
import { SigUpKindredDto } from 'src/kindred/kindredDto';
import { KindredService } from 'src/kindred/kindred.service';

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

  async signUpKindred(userData: SigUpKindredDto, origin: string) {
    console.log('creating new account');

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

    // Create user first
    const user = await this.usersService.create(
      userData.firstname,
      userData.lastname,
      userData.email,
      userData.password,
      userData.phone,
      userData.stateOfOrigin,
      userData.lgaOfOrigin,
      userData.NIN,
      'kindred_head',
      origin,
    );

    try {
      // Then try to create kindred
      await this.kindredService.createKindred({
        userId: userData.userId,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        lga: userData.lga,
        stateOfOrigin: user.stateOfOrigin,
        address: userData.address,
        phone: userData.phone,
        kindred: userData.kindred,
      });
    } catch (err) {
      console.error('Kindred creation failed:', err);
      await this.usersService.deleteUserById(user.id);
      throw new InternalServerErrorException(
        'Failed to create kindred: ' + err.message,
      );
    }

    // Return token and user if all successful
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
