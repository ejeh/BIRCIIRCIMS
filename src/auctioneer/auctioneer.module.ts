import { forwardRef, Module } from '@nestjs/common';
import { AuctioneerController } from './auctioneer.controller';
import { AuctioneerService } from './auctioneer.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Auctioneer, AuctioneerSchema } from './auctioneer.schema';
import { UsersService } from 'src/users/users.service';
import {
  Counter,
  CounterSchema,
} from 'src/indigene-certificate/counter.schema';
import { NotificationSchema } from 'src/notifications/notications.schema';
import { ResubmissionService } from 'src/common/services/resubmission.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';
import { NotificationsService } from 'src/notifications/notifications.service';
import { HttpModule } from '@nestjs/axios';
import { RolePermissionSchema } from 'src/roles/role-permission.schema';
import { RoleAssignmentService } from 'src/roles/role-assignment.service';
import { SmsService } from 'src/sms/sms.service';
import { MailService } from 'src/mail/mail.service';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import {
  RoleAssignment,
  RoleAssignmentSchema,
} from 'src/users/users.role-assiggnment.schema';
import { ConfigService } from '@nestjs/config';
import { TransactionModule } from 'src/transaction/transaction.module';
import { IndigeneCertificateModule } from 'src/indigene-certificate/indigene-certificate.module';
import { IdcardModule } from 'src/idcard/idcard.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    HttpModule,

    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
      { name: 'Notification', schema: NotificationSchema },
      { name: Auctioneer.name, schema: AuctioneerSchema },
      { name: 'RolePermission', schema: RolePermissionSchema },
      { name: RoleAssignment.name, schema: RoleAssignmentSchema },
    ]),
    forwardRef(() => UsersModule),
    forwardRef(() => IndigeneCertificateModule),
    forwardRef(() => IdcardModule),
    forwardRef(() => TransactionModule),
  ],
  controllers: [AuctioneerController],
  providers: [
    AuctioneerService,
    NotificationsService,
    NotificationsGateway,
    JwtService,
    ResubmissionService,
    RoleAssignmentService,
    SmsService,
    MailService,
    CloudinaryService,
    ConfigService,
  ],

  exports: [AuctioneerService, MongooseModule],
})
export class AuctioneerModule {}
