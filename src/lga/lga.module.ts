import { Module } from '@nestjs/common';
import { LgaController } from './lga.controller';
import { LgaService } from './lga.service';
import { LgaModel } from './lga.model';
import { UserModel } from 'src/users/users.model';

@Module({
  imports: [LgaModel, UserModel],
  controllers: [LgaController],
  providers: [LgaService],
})
export class LgaModule {}
