import { Test, TestingModule } from '@nestjs/testing';
import { VerificationLimitsService } from './verification-limits.service';

describe('VerificationLimitsService', () => {
  let service: VerificationLimitsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VerificationLimitsService],
    }).compile();

    service = module.get<VerificationLimitsService>(VerificationLimitsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
