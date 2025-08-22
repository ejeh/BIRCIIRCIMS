import { MongooseModule } from '@nestjs/mongoose';
import { LgaSchema } from './lga.schema';

export const LgaModel = MongooseModule.forFeature([
  { name: 'Lga', schema: LgaSchema },
]);
