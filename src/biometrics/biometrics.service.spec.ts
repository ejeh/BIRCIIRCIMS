import { Test, TestingModule } from '@nestjs/testing';
import { BiometricsService } from './biometrics.service';

describe('BiometricsService', () => {
  let service: BiometricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BiometricsService],
    }).compile();

    service = module.get<BiometricsService>(BiometricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
