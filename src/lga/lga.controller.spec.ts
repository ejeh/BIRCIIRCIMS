import { Test, TestingModule } from '@nestjs/testing';
import { LgaController } from './lga.controller';

describe('LgaController', () => {
  let controller: LgaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LgaController],
    }).compile();

    controller = module.get<LgaController>(LgaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
