// src/biometric/biometric.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Biometric, BiometricSchema } from './biometrics.schema';
import { BiometricsService } from './biometrics.service';
import { BiometricsController } from './biometrics.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Biometric.name, schema: BiometricSchema },
    ]),
  ],
  providers: [BiometricsService],
  controllers: [BiometricsController],
  exports: [BiometricsService],
})
export class BiometricsModule {}
