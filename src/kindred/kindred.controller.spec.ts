import { Test, TestingModule } from '@nestjs/testing';
import { KindredController } from './kindred.controller';

describe('KindredController', () => {
  let controller: KindredController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [KindredController],
    }).compile();

    controller = module.get<KindredController>(KindredController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
