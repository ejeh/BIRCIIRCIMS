import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
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
import { Request } from 'express';
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
  activate(@Param() params: ActivateParams) {
    return this.authService.activate(params);
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
