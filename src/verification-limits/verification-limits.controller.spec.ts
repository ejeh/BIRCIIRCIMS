import { Test, TestingModule } from '@nestjs/testing';
import { VerificationLimitsController } from './verification-limits.controller';

describe('VerificationLimitsController', () => {
  let controller: VerificationLimitsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VerificationLimitsController],
    }).compile();

    controller = module.get<VerificationLimitsController>(VerificationLimitsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
