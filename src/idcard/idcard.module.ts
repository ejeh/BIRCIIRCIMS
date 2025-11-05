import { forwardRef, Module } from '@nestjs/common';
import { IdcardController } from './idcard.controller';
import { IdcardService } from './idcard.service';
import { UserModel } from 'src/users/users.model';
import { MongooseModule } from '@nestjs/mongoose';
import { IdCard, IdCardSchema } from './idcard.schema';
import setupSwagger from '../users/users.swagger';
import { UserMailerService } from 'src/users/users.mailer.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { SmsService } from 'src/sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { HttpModule } from '@nestjs/axios';
import { LgaModel } from 'src/lga/lga.model';
import { IndigeneCertificateModule } from 'src/indigene-certificate/indigene-certificate.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsService } from 'src/notifications/notifications.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    HttpModule,
    UserModel,
    LgaModel,
    MongooseModule.forFeature([{ name: IdCard.name, schema: IdCardSchema }]),
    forwardRef(() => UsersModule),
    forwardRef(() => IndigeneCertificateModule),
  ],
  controllers: [IdcardController],
  providers: [
    IdcardService,
    UserMailerService,
    NotificationsGateway,
    SmsService,
    ConfigService,
    MailService,
    CloudinaryService,
    NotificationsService,
    JwtService,
  ],
  exports: [IdcardService, MongooseModule],
})
export class IdcardModule {}
setupSwagger(IdcardModule);
