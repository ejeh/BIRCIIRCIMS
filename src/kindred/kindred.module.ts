import { Module } from '@nestjs/common';
import { KindredController } from './kindred.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { KindredSchema } from './kindred.schema';
import { KindredService } from './kindred.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Kindred', schema: KindredSchema }]),
  ],
  controllers: [KindredController],
  providers: [KindredService],
})
export class KindredModule {}
