import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ActivateParams,
  AdminSignUpDto,
  AuthenticatedUser,
  ChangePasswordDto,
  ForgottenPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignUpDto,
  Verify2FADto,
} from './auth.interface';
import { getOriginHeader } from './auth';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AppRequest } from 'src/generic/generic.interface';
import config from 'src/config';
import { JwtAuthGuard } from './jwt-auth.guard';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('activate/:userId/:activationToken')
  async activate(@Param() params: ActivateParams, @Res() res: Response) {
    const getFrontendBaseUrl = () => {
      return config.isDev
        ? process.env.FRONTEND_URL || 'http://127.0.0.1:5503'
        : 'https://citizenship.benuestate.gov.ng';
    };
    const result = await this.authService.activate(params);
    const redirectUrl = result.success
      ? `${getFrontendBaseUrl()}/app/auth/activation-success.html`
      : `${getFrontendBaseUrl()}/app/auth/activation-failed.html`;

    return res.redirect(redirectUrl);
  }

  @Post('resend-activation')
  async resendActivationEmail(
    @Body('email') email: string,
    @Req() req: Request,
  ) {
    return await this.authService.resendActivationEmail(
      email,
      getOriginHeader(req),
    );
  }

  @Post('signup')
  @ApiResponse({ type: AuthenticatedUser })
  signup(@Body() signUpDto: SignUpDto, @Req() req: Request) {
    return this.authService.signupUser(signUpDto, getOriginHeader(req), 'user');
  }

  @Post('admin-signup')
  @ApiResponse({ type: AuthenticatedUser })
  adminSignup(@Body() adminSignUpDto: AdminSignUpDto, @Req() req: Request) {
    const role = adminSignUpDto.role;
    return this.authService.adminSignup(
      adminSignUpDto,
      getOriginHeader(req),
      role,
    );
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiResponse({ type: AuthenticatedUser })
  login(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.login(req?.user);
  }

  // @UseGuards(AuthGuard('local'))
  // @Post('login-kindred')
  // @ApiResponse({ type: AuthenticatedUser })
  // loginAgent(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
  //   return this.authService.loginKindred(req?.user);
  // }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgottenPasswordDto, @Req() req: Request) {
    return this.authService.forgottenPassword(body, getOriginHeader(req));
  }

  @Post('reset-password/:token')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Param('token') token: string,
  ) {
    return this.authService.resetPassword(resetPasswordDto, token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    try {
      await this.authService.changePassword(req.user.id, changePasswordDto);
      return { message: 'Password changed successfully' };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/setup')
  async setup2FA(@Req() req) {
    return this.authService.generate2FASecret(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async get2FAStatus(@Req() req) {
    const user = await this.authService.getUserById(req.user.id);
    return {
      hasSecret: !!user.twoFactorSecret,
      isEnabled: user.twoFactorEnabled,
      userId: req.user.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/verify')
  async verify2FA(@Req() req, @Body() verify2FADto: Verify2FADto) {
    await this.authService.verify2FA(req.user.id, verify2FADto);
    return { message: 'Verification successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  async enable2FA(@Req() req) {
    const { backupCodes } = await this.authService.enable2FA(req.user.userId);
    return { message: '2FA enabled successfully', backupCodes };
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  async disable2FA(@Req() req) {
    await this.authService.disable2FA(req.user.userId);
    return { message: '2FA disabled successfully' };
  }

  @Post('verify')
  async verifyNIN(@Body() { nin }: { nin: string }) {
    const fakeDB = {
      '12345678901': {
        firstname: 'Godfrey',
        lastname: 'Ejeh',
        middlename: 'Akor',
        dob: '1990-01-01',
        phone: '08079710659',
        stateOfOrigin: 'Benue',
        lga: 'Ogbadibo',
      },
      '98765432109': {
        firstname: 'John',
        lastname: 'Doe',
        middlename: 'Smith',
        dob: '1990-01-01',
        phone: '08039710658',
        stateOfOrigin: 'Benue',
        lga: 'Buruku',
      },
      '98765432102': {
        firstname: 'Simon',
        lastname: 'Iber',
        middlename: 'Akper',
        dob: '1990-01-01',
        phone: '08033710658',
        stateOfOrigin: 'Benue',
        lga: 'Buruku',
      },
      '98765432162': {
        firstname: 'Sheyi',
        lastname: 'Shay',
        middlename: 'Oladele',
        dob: '1990-01-01',
        phone: '08133710658',
        stateOfOrigin: 'Ogun',
        lga: 'Ifo',
      },
      '88765432102': {
        firstname: 'Arome',
        lastname: 'Mbur',
        middlename: 'Idris',
        dob: '1990-01-01',
        phone: '08030710658',
        stateOfOrigin: 'Kogi',
        lga: 'Okene',
      },

      '88765432105': {
        firstname: 'Derick',
        lastname: 'Gbaden',
        middlename: 'Godwin',
        dob: '1990-01-01',
        phone: '08043710650',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },

      '88765432103': {
        firstname: 'James',
        lastname: 'Gbaden',
        middlename: 'Derick',
        dob: '1967-01-01',
        phone: '08043710689',
        stateOfOrigin: 'Benue',
        lga: 'Buruku',
      },

      '88765432101': {
        firstname: 'Charles',
        lastname: 'Luper',
        middlename: 'Tersoo',
        dob: '1990-01-01',
        phone: '08043710555',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },

      '88765432131': {
        firstname: 'Victor',
        lastname: 'Atir',
        middlename: 'James',
        dob: '1990-01-01',
        phone: '08043710666',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },
      '88765432133': {
        firstname: 'Akor',
        lastname: 'Ejeh',
        middlename: 'Godfrey',
        dob: '1990-01-01',
        phone: '08043710667',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },

      '88765432111': {
        firstname: 'Gabriel ',
        lastname: 'Nwaje',
        middlename: 'Sunday',
        dob: '1987-01-01',
        phone: '08043710633',
        stateOfOrigin: 'Enugu',
        lga: 'Nsukka',
      },

      '88765432456': {
        firstname: 'Adrian',
        lastname: 'Idoko',
        dob: '1987-01-01',
        phone: '08043710536',
        stateOfOrigin: 'Delta',
        lga: 'Ughelli North',
      },

      '18765432103': {
        firstname: 'Mary',
        lastname: 'Jane',
        middlename: 'Doe',
        dob: '1985-07-15',
        phone: '08049710668',
        stateOfOrigin: 'Benue',
        lga: 'Buruku',
      },

      '33765432103': {
        firstname: 'Japheth',
        lastname: 'Kor',
        middlename: 'Tersoo',
        dob: '1988-08-20',
        phone: '08078710659',
        stateOfOrigin: 'Benue',
        lga: 'Gwer East',
      },

      '33765432155': {
        firstname: 'Steven',
        lastname: 'Ajiga',
        middlename: 'Ajene',
        dob: '1991-02-25',
        phone: '08053710658',
        stateOfOrigin: 'Benue',
        lga: 'Oju',
      },

      '24765432155': {
        firstname: 'Joseph',
        lastname: 'Agbo',
        middlename: 'Suleman',
        dob: '1975-07-15',
        phone: '08039710648',
        stateOfOrigin: 'Benue',
        lga: 'Apa',
      },

      '24768432155': {
        firstname: 'Terrence',
        lastname: 'Terkula',
        middlename: 'Terkimbi',
        dob: '1989-07-15',
        phone: '08033710656',
        stateOfOrigin: 'Benue',
        lga: 'Gwer West',
      },
    };

    const data = fakeDB[nin];
    if (!data) throw new BadRequestException('NIN not found');
    return { success: true, data };
  }

  @Post('check-existence')
  @ApiOperation({
    summary: 'Check if email, phone, or NIN already exists for a user',
  })
  @ApiResponse({
    status: 200,
    description:
      'Returns an object indicating which identifiers already exist (e.g., { email: true, phone: false, nin: false })',
  })
  async checkUserExistence(
    @Body() body: { email?: string; phone?: string; nin?: string },
  ) {
    if (!body.email && !body.phone && !body.nin) {
      throw new BadRequestException(
        'At least one identifier (email, phone, or NIN) must be provided.',
      );
    }
    return this.authService.checkUserExistence(body);
  }
}
