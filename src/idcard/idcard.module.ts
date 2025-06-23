import { Module } from '@nestjs/common';
import { IdcardController } from './idcard.controller';
import { IdcardService } from './idcard.service';
import { UserModel } from 'src/users/users.model';
import { MongooseModule } from '@nestjs/mongoose';
import { IdCard, IdCardSchema } from './idcard.schema';
import setupSwagger from '../users/users.swagger';
import { UsersService } from 'src/users/users.service';
import { UserMailerService } from 'src/users/users.mailer.service';
import { NotificationsGateway } from 'src/notifications/notifications.gateway';

@Module({
  imports: [
    UserModel,
    MongooseModule.forFeature([{ name: IdCard.name, schema: IdCardSchema }]),
  ],
  controllers: [IdcardController],
  providers: [
    IdcardService,
    UsersService,
    UserMailerService,
    NotificationsGateway,
  ],
  exports: [IdcardService],
})
export class IdcardModule {}
setupSwagger(IdcardModule);
