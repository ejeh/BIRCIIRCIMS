import { Test, TestingModule } from '@nestjs/testing';
import { AuctioneerController } from './auctioneer.controller';

describe('AuctioneerController', () => {
  let controller: AuctioneerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuctioneerController],
    }).compile();

    controller = module.get<AuctioneerController>(AuctioneerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
