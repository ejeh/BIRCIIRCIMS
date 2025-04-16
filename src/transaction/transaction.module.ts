import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSchema, Transaction } from './transaction.schema';
import { IndigeneCertificateService } from 'src/indigene-certificate/indigene-certificate.service';
import { Certificate } from 'src/indigene-certificate/indigene-certicate.schema';
import { KindredModel } from 'src/kindred/kindred.model';
import { UserModel } from 'src/users/users.model';

@Module({
  imports: [
    KindredModel,
    UserModel,
    MongooseModule.forFeature([{ name: 'Certificate', schema: Certificate }]),
    MongooseModule.forFeature([
      { name: 'Transaction', schema: TransactionSchema },
    ]),
  ],
  controllers: [TransactionController],
  providers: [TransactionService, IndigeneCertificateService],
})
export class TransactionModule {}
