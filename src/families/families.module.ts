import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { FamilyRoleGuard } from './guards/family-role.guard';
import { Family, FamilySchema } from './schemas/family.schema';
import { FamilyMember, FamilyMemberSchema } from './schemas/family-member.schema';
import { Dependent, DependentSchema } from './schemas/dependent.schema';
import { FamilyInvitation, FamilyInvitationSchema } from './schemas/family-invitation.schema';
import { FamilyDocument, FamilyDocumentSchema } from './schemas/family-document.schema';
import { FamilyAuditLog, FamilyAuditLogSchema } from './schemas/family-audit-log.schema';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { UsersModule } from 'src/users/users.module';
import { TransactionModule } from 'src/transaction/transaction.module';
import { MailModule } from 'src/mail/mail.module';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { Certificate, CertificateSchema } from 'src/indigene-certificate/indigene-certicate.schema';
import { IdCard, IdCardSchema } from 'src/idcard/idcard.schema';
import { Transaction, TransactionSchema } from 'src/transaction/transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Family.name, schema: FamilySchema },
      { name: FamilyMember.name, schema: FamilyMemberSchema },
      { name: Dependent.name, schema: DependentSchema },
      { name: FamilyInvitation.name, schema: FamilyInvitationSchema },
      { name: FamilyDocument.name, schema: FamilyDocumentSchema },
      { name: FamilyAuditLog.name, schema: FamilyAuditLogSchema },
      { name: Certificate.name, schema: CertificateSchema },
      { name: IdCard.name, schema: IdCardSchema },
      { name: 'Transaction', schema: TransactionSchema },
    ]),
    NotificationsModule,
    UsersModule,
    forwardRef(() => TransactionModule),
    MailModule,
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService, FamilyRoleGuard, CloudinaryService],
  exports: [FamiliesService, MongooseModule],
})
export class FamiliesModule {}
