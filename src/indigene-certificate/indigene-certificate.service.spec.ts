import { Test, TestingModule } from '@nestjs/testing';
import { IndigeneCertificateService } from './indigene-certificate.service';

describe('IndigeneCertificateService', () => {
  let service: IndigeneCertificateService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IndigeneCertificateService],
    }).compile();

    service = module.get<IndigeneCertificateService>(IndigeneCertificateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
