import { Test, TestingModule } from '@nestjs/testing';
import { LgaService } from './lga.service';

describe('LgaService', () => {
  let service: LgaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LgaService],
    }).compile();

    service = module.get<LgaService>(LgaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
