import {
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
import { UsersService } from 'src/users/users.service';
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
import { console } from 'inspector';

@ApiTags('auth')
@ApiBearerAuth()
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Get('activate/:userId/:activationToken')
  async activate(@Param() params: ActivateParams, @Res() res: Response) {
    // return this.authService.activate(params);
    const result = await this.authService.activate(params);
    if (result.success) {
      return res.redirect('http://127.0.0.1:5501/auth/activation-success.html');
    } else {
      return res.redirect(`http://127.0.0.1:5501/auth/activation-failed.html`);
    }
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

  @UseGuards(AuthGuard('local'))
  @Post('login')
  @ApiResponse({ type: AuthenticatedUser })
  login(@Req() req: AppRequest, @Body() loginDto: LoginDto) {
    return this.authService.login(req?.user);
  }

  @Post('forgot-password')
  forgotPassword(@Body() body: ForgottenPasswordDto, @Req() req: Request) {
    return this.authService.forgottenPassword(body, getOriginHeader(req));
  }
  @Post('reset-password')
  resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body);
  }

  // @Get('session')
  // checkSession(@Req() req: AppRequest) {
  //   console.log(req?.user);
  //   return { user: req?.user };
  // }
}
