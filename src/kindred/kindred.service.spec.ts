import { Test, TestingModule } from '@nestjs/testing';
import { KindredService } from './kindred.service';

describe('KindredService', () => {
  let service: KindredService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KindredService],
    }).compile();

    service = module.get<KindredService>(KindredService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
