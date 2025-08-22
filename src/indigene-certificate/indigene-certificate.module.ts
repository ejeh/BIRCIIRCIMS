import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndigeneCertificateController } from './indigene-certificate.controller';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { Certificate, CertificateSchema } from './indigene-certicate.schema';
import setupSwagger from '../users/users.swagger';
import { UsersService } from 'src/users/users.service';
import { UserMailerService } from 'src/users/users.mailer.service';
import { UserModel } from 'src/users/users.model';
import { KindredModel } from 'src/kindred/kindred.model';
import { SmsService } from 'src/sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { HttpModule } from '@nestjs/axios';
import { LgaModel } from 'src/lga/lga.model';

@Module({
  imports: [
    HttpModule,
    UserModel,
    KindredModel,
    LgaModel,
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ],
  controllers: [IndigeneCertificateController],

  providers: [
    IndigeneCertificateService,
    UsersService,
    UserMailerService,
    SmsService,
    ConfigService,
    MailService,
    CloudinaryService,
  ],

  exports: [IndigeneCertificateService],
})
export class IndigeneCertificateModule {}
setupSwagger(IndigeneCertificateModule);
