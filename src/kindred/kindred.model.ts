import { MongooseModule } from '@nestjs/mongoose';
import { KindredSchema } from './kindred.schema';

export const KindredModel = MongooseModule.forFeature([
  { name: 'Kindred', schema: KindredSchema },
]);
