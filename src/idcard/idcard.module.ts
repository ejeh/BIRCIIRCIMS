import { Module } from '@nestjs/common';
import { IdcardController } from './idcard.controller';
import { IdcardService } from './idcard.service';

@Module({
  controllers: [IdcardController],
  providers: [IdcardService]
})
export class IdcardModule {}
