import { Module, forwardRef } from '@nestjs/common';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { ReportSchema } from './schemas/report.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduledReportSchema } from './schemas/scheduled-report.schema';
import { User } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { UserModel } from 'src/users/users.model';
import {
  Certificate,
  CertificateSchema,
} from 'src/indigene-certificate/indigene-certicate.schema';
import { IdCardSchema } from 'src/idcard/idcard.schema';
import { IdcardModule } from 'src/idcard/idcard.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { NotificationsService } from 'src/notifications/notifications.service';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    UserModel,
    MongooseModule.forFeature([{ name: 'Report', schema: ReportSchema }]),
    MongooseModule.forFeature([
      { name: 'ScheduledReport', schema: ScheduledReportSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'Certificate', schema: CertificateSchema },
    ]),
    forwardRef(() => IdcardModule),
    forwardRef(() => TransactionModule),
  ],

  controllers: [ReportController],
  providers: [
    ReportService,
    UsersService,
    NotificationsService,
    SmsService,
    MailService,
    NotificationsGateway,
    ConfigService,
    JwtService,
  ],
})
export class ReportModule {}
