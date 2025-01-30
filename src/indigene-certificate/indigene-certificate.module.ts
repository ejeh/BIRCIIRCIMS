import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IndigeneCertificateController } from './indigene-certificate.controller';
import { IndigeneCertificateService } from './indigene-certificate.service';
import { Certificate, CertificateSchema } from './indigene-certicate.schema';
import setupSwagger from '../users/users.swagger';
import { UsersService } from 'src/users/users.service';
import { UserMailerService } from 'src/users/users.mailer.service';
import { UserModel } from 'src/users/users.model';

@Module({
  imports: [
    UserModel,
    MongooseModule.forFeature([
      { name: Certificate.name, schema: CertificateSchema },
    ]),
  ],
  controllers: [IndigeneCertificateController],

  providers: [IndigeneCertificateService, UsersService, UserMailerService],

  exports: [IndigeneCertificateService],
})
export class IndigeneCertificateModule {}
setupSwagger(IndigeneCertificateModule);
