import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { comparePassword } from './auth';
import { LoginCredentialsException } from 'src/common/exception';
import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
} from './auth.interface';

@Injectable()
export class AuthService {
  constructor(
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

    return {
      token: this.jwtService.sign({ id: user.id }, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
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
  // async loginAdmin(user?: any) {
  //   if (user.role == 'admin') {
  //     return {
  //       token: this.jwtService.sign(
  //         //@ts-ignore
  //         { ...user?.getPublicData() },
  //         //@ts-ignore
  //         { subject: `${user?.id}` },
  //       ),
  //       //@ts-ignore
  //       user: user?.getPublicData(),
  //     };
  //   }
  //   throw new UnauthorizedException(
  //     'Account roles doesnt support admin activities',
  //   );
  // }
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
