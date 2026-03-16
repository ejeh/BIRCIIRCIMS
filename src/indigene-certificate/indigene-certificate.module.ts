import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndigeneCertificateController } from './indigene-certificate.controller';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { Certificate, CertificateSchema } from './indigene-certicate.schema';
import setupSwagger from '../users/users.swagger';
import { UserMailerService } from 'src/users/users.mailer.service';
import { UserModel } from 'src/users/users.model';
import { KindredModel } from 'src/kindred/kindred.model';
import { SmsService } from 'src/sms/sms.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { HttpModule } from '@nestjs/axios';
import { LgaModel } from 'src/lga/lga.model';
import { IdcardModule } from 'src/idcard/idcard.module';
import { UsersModule } from 'src/users/users.module';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationSchema } from 'src/notifications/notications.schema';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { ResubmissionService } from 'src/common/services/resubmission.service';

import { Counter, CounterSchema } from './counter.schema';
import { TransactionModule } from 'src/transaction/transaction.module';
import { User, UserSchema } from 'src/users/users.schema';

@Module({
  imports: [
    HttpModule,
    KindredModel,
    LgaModel,
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: User.name, schema: UserSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),

    forwardRef(() => UsersModule),
    forwardRef(() => IdcardModule),
    forwardRef(() => TransactionModule),
  ],
  controllers: [IndigeneCertificateController],

  providers: [
    IndigeneCertificateService,
    UserMailerService,
    SmsService,
    ConfigService,
    MailService,
    CloudinaryService,
    NotificationsService,
    NotificationsGateway,
    JwtService,
    ResubmissionService,
  ],

  exports: [IndigeneCertificateService, MongooseModule],
})
export class IndigeneCertificateModule {}
setupSwagger(IndigeneCertificateModule);
