import { Test, TestingModule } from '@nestjs/testing';
import { BiometricsController } from './biometrics.controller';

describe('BiometricsController', () => {
  let controller: BiometricsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BiometricsController],
    }).compile();

    controller = module.get<BiometricsController>(BiometricsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
