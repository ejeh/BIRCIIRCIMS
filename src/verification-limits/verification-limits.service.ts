// src/verification-limits/verification-limits.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VerificationLimits } from './verification-limits.schema';

@Injectable()
export class VerificationLimitsService {
  constructor(
    @InjectModel(VerificationLimits.name)
    private verificationLimitsModel: Model<VerificationLimits>,
  ) {}

  async getVerificationLimits(): Promise<VerificationLimits> {
    let limits = await this.verificationLimitsModel.findOne().exec();

    // If no limits exist, create default ones
    if (!limits) {
      limits = new this.verificationLimitsModel({
        familyVerificationLimit: 3,
        neighborVerificationLimit: 3,
        lastUpdated: new Date(),
        updatedBy: 'system',
      });
      await limits.save();
    }

    return limits;
  }

  async updateVerificationLimits(
    familyLimit: number,
    neighborLimit: number,
    adminId: string,
  ): Promise<VerificationLimits> {
    let limits = await this.verificationLimitsModel.findOne().exec();

    if (!limits) {
      limits = new this.verificationLimitsModel({
        familyVerificationLimit: familyLimit,
        neighborVerificationLimit: neighborLimit,
        lastUpdated: new Date(),
        updatedBy: adminId,
      });
    } else {
      limits.familyVerificationLimit = familyLimit;
      limits.neighborVerificationLimit = neighborLimit;
      limits.lastUpdated = new Date();
      limits.updatedBy = adminId;
    }

    return limits.save();
  }
}
