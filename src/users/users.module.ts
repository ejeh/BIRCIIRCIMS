import { Module, forwardRef } from '@nestjs/common';
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
import { LgaModel } from 'src/lga/lga.model';
import { IndigeneCertificateModule } from 'src/indigene-certificate/indigene-certificate.module';
import { MongooseModule } from '@nestjs/mongoose';
import { IdcardModule } from 'src/idcard/idcard.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { VerificationLimitsModule } from 'src/verification-limits/verification-limits.module';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesModule } from 'src/roles/roles.module';

@Module({
  imports: [
    UserModel,
    LgaModel,
    forwardRef(() => NotificationsModule),
    forwardRef(() => IndigeneCertificateModule),
    forwardRef(() => IdcardModule),
    forwardRef(() => TransactionModule),
    VerificationLimitsModule,

    JwtModule.register({
      secret: process.env.SECRET_KEY,
      signOptions: { expiresIn: '1h' },
    }),
    RolesModule,
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

  exports: [UsersService, MongooseModule],
})
export class UsersModule {}

setupSwagger(UsersModule);
