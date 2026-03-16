import { Test, TestingModule } from '@nestjs/testing';
import { AuctioneerService } from './auctioneer.service';

describe('AuctioneerService', () => {
  let service: AuctioneerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuctioneerService],
    }).compile();

    service = module.get<AuctioneerService>(AuctioneerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
