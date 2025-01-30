import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './users.schema';

export const UserModel = MongooseModule.forFeature([
  { name: 'User', schema: UserSchema },
]);
