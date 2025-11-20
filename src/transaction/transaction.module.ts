import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSchema, Transaction } from './transaction.schema';
import { IndigeneCertificateService } from 'src/indigene-certificate/indigene-certificate.service';
import { Certificate } from 'src/indigene-certificate/indigene-certicate.schema';
import { KindredModel } from 'src/kindred/kindred.model';
import { UserModel } from 'src/users/users.model';
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationSchema } from 'src/notifications/notications.schema';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { JwtService } from '@nestjs/jwt';
import { IdcardService } from 'src/idcard/idcard.service';
import { IdCard } from 'src/idcard/idcard.schema';
import { ResubmissionService } from 'src/common/services/resubmission.service';

@Module({
  imports: [
    KindredModel,
    UserModel,
    MongooseModule.forFeature([{ name: 'Certificate', schema: Certificate }]),
    MongooseModule.forFeature([{ name: 'IdCard', schema: IdCard }]),

    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    IndigeneCertificateService,
    NotificationsService,
    NotificationsGateway,
    JwtService,
    IdcardService,
    ResubmissionService,
  ],
  exports: [TransactionService, MongooseModule],
})
export class TransactionModule {}
