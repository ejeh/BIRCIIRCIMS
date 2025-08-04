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
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  ActivateParams,
  AuthenticatedUser,
  ForgottenPasswordDto,
  LoginDto,
  ResetPasswordDto,
  SignUpDto,
} from './auth.interface';
import { getOriginHeader } from './auth';
import { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AppRequest } from 'src/generic/generic.interface';
import config from 'src/config';
import { SigUpKindredDto } from 'src/kindred/kindredDto';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('activate/:userId/:activationToken')
  async activate(@Param() params: ActivateParams, @Res() res: Response) {
    const getFrontendBaseUrl = () => {
      return config.isDev
        ? process.env.FRONTEND_URL || 'http://127.0.0.1:5501'
        : 'https://citizenship.benuestate.gov.ng';
    };
console.log(getFrontendBaseUrl)
    const result = await this.authService.activate(params);
    const redirectUrl = result.success
      ? `${getFrontendBaseUrl()}/source/auth/activation-success.html`
      : `${getFrontendBaseUrl()}/source/auth/activation-failed.html`;

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
    return this.authService.signUpUser(signUpDto, getOriginHeader(req), 'user');
  }

  @Post('signup-kindred')
  @ApiResponse({ type: AuthenticatedUser })
  async signupAgent(@Body() signUpDto: SigUpKindredDto, @Req() req: Request) {
    return this.authService.signUpKindred(signUpDto, getOriginHeader(req));
  }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiResponse({ type: AuthenticatedUser })
  login(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.login(req?.user);
  }

  @UseGuards(AuthGuard('local'))
  @Post('login-kindred')
  @ApiResponse({ type: AuthenticatedUser })
  loginAgent(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.loginKindred(req?.user);
  }

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

  @Post('verify')
  async verifyNIN(@Body() { nin }: { nin: string }) {
    const fakeDB = {
      '12345678901': {
        fullName: 'Godfrey Ejeh',
        dob: '1990-01-01',
        phone: '08079710658',
        stateOfOrigin: 'Benue',
        lga: 'Ogbadibo',
      },
      '98765432109': {
        fullName: 'John Doe',
        dob: '1990-01-01',
        phone: '08039710658',
        stateOfOrigin: 'Benue',
        lga: 'Buruku',
      },
      '98765432102': {
        fullName: 'Simon Iber',
        dob: '1990-01-01',
        phone: '08033710658',
        stateOfOrigin: 'Benue',
        lga: 'Buruku',
      },
      '98765432162': {
        fullName: 'Sheyi shay',
        dob: '1990-01-01',
        phone: '08133710658',
        stateOfOrigin: 'Ogun',
        lga: 'Ifo',
      },
      '88765432102': {
        fullName: 'Arome Mbur',
        dob: '1990-01-01',
        phone: '08030710658',
        stateOfOrigin: 'Kogi',
        lga: 'Okene',
      },

      '88765432105': {
        fullName: 'Derick Gbaden',
        dob: '1990-01-01',
        phone: '08043710650',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },

      '88765432101': {
        fullName: 'Charles Luper',
        dob: '1990-01-01',
        phone: '08043710658',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },

      '88765432131': {
        fullName: 'Victor Atir',
        dob: '1990-01-01',
        phone: '08043710666',
        stateOfOrigin: 'Benue',
        lga: 'Gboko',
      },
    };

    const data = fakeDB[nin];
    if (!data) throw new BadRequestException('NIN not found');
    return { success: true, data };
  }
}
