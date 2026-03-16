import { Module, forwardRef } from '@nestjs/common';
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
import { CounterSchema } from 'src/indigene-certificate/counter.schema';
import { UsersService } from 'src/users/users.service';
import { RoleAssignmentService } from 'src/roles/role-assignment.service';
import { RolePermissionSchema } from 'src/roles/role-permission.schema';
import {
  RoleAssignment,
  RoleAssignmentSchema,
} from 'src/users/users.role-assiggnment.schema';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { ConfigService } from '@nestjs/config';
import { IndigeneCertificateModule } from 'src/indigene-certificate/indigene-certificate.module';
import { IdcardModule } from 'src/idcard/idcard.module';
import { AuctioneerModule } from 'src/auctioneer/auctioneer.module';
import { AuctioneerSchema } from 'src/auctioneer/auctioneer.schema';

@Module({
  imports: [
    KindredModel,
    UserModel,
    MongooseModule.forFeature([
      { name: 'Certificate', schema: Certificate },
      { name: 'Auctioneer', schema: AuctioneerSchema },
      { name: 'Counter', schema: CounterSchema },
      { name: 'RolePermission', schema: RolePermissionSchema },
      { name: RoleAssignment.name, schema: RoleAssignmentSchema },
    ]),
    MongooseModule.forFeature([{ name: 'IdCard', schema: IdCard }]),

    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
    ]),
    MongooseModule.forFeature([
      { name: 'Notification', schema: NotificationSchema },
    ]),
    forwardRef(() => IndigeneCertificateModule),
    forwardRef(() => IdcardModule),
    forwardRef(() => AuctioneerModule),
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    NotificationsService,
    NotificationsGateway,
    JwtService,
    ResubmissionService,
    UsersService,
    RoleAssignmentService,
    SmsService,
    MailService,
    CloudinaryService,
    ConfigService,
  ],
  exports: [TransactionService, MongooseModule],
})
export class TransactionModule {}
