import { MongooseModule } from '@nestjs/mongoose';
import { dbUrl } from './config';

export const DatabaseModule = MongooseModule.forRoot(dbUrl);
