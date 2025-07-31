import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserMailerService } from './users.mailer.service';
import { UsersService } from './users.service';
import { UserModel } from './users.model';
import { JwtModule } from '@nestjs/jwt';
import setupSwagger from './users.swagger';
import { SmsService } from 'src/sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  imports: [
    UserModel,
    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [UsersController],

  providers: [
    UserMailerService,
    UsersService,
    SmsService,
    ConfigService,
    MailService,
    CloudinaryService,
  ],

  exports: [UsersService],
})
export class UsersModule {}

setupSwagger(UsersModule);
