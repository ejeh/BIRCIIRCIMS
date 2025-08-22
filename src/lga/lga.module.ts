import { Module } from '@nestjs/common';
import { LgaController } from './lga.controller';
import { LgaService } from './lga.service';
import { LgaModel } from './lga.model';

@Module({
  imports: [LgaModel],
  controllers: [LgaController],
  providers: [LgaService],
})
export class LgaModule {}
