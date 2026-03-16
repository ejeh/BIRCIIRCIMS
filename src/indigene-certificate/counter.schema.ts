import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CounterDocument = Counter & Document;

@Schema({ collection: 'counters' })
export class Counter {
  @Prop({ required: true, unique: true })
  key: string;

  @Prop({ default: 0 })
  value: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
