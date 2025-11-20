// src/verification-limits/verification-limits.module.ts
import { Module } from '@nestjs/common';
import { VerificationLimitsController } from './verification-limits.controller';
import { VerificationLimitsService } from './verification-limits.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VerificationLimits,
  VerificationLimitsSchema,
} from './verification-limits.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationLimits.name, schema: VerificationLimitsSchema },
    ]),
  ],
  controllers: [VerificationLimitsController],
  providers: [VerificationLimitsService],
  exports: [VerificationLimitsService],
})
export class VerificationLimitsModule {}
