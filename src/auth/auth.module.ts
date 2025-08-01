import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import config from 'src/config';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './localstrategy';
import { UserMailerService } from 'src/users/users.mailer.service';
import { UsersService } from 'src/users/users.service';
import { UserModel } from 'src/users/users.model';
import { KindredService } from 'src/kindred/kindred.service';
import { KindredModel } from 'src/kindred/kindred.model';
import { SmsService } from 'src/sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';

@Module({
  imports: [
    UsersModule,
    UserModel,
    KindredModel,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: {},
    }),
    PassportModule,
  ],
  controllers: [AuthController],

  providers: [
    AuthService,
    JwtAuthGuard,
    JwtStrategy,
    LocalStrategy,
    UserMailerService,
    UsersService,
    KindredService,
    SmsService,
    ConfigService,
    MailService,
  ],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
