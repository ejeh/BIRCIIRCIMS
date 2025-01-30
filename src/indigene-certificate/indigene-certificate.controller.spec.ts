import { Test, TestingModule } from '@nestjs/testing';
import { IndigeneCertificateController } from './indigene-certificate.controller';

describe('IndigeneCertificateController', () => {
  let controller: IndigeneCertificateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IndigeneCertificateController],
    }).compile();

    controller = module.get<IndigeneCertificateController>(IndigeneCertificateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
