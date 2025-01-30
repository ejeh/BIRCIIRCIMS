import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document } from 'mongoose';

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class IdCard extends Document {
  @ApiProperty({
    description: 'User ID',
    example: '1234567890',
  })
  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending',
  })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  card_type: string;

  @Prop({ required: true, default: new Date().toISOString() })
  dateOfIssue: Date;

  @Prop({ required: true, default: new Date().toISOString() })
  dateOfExpiration: Date;
}

export const IdCardSchema = SchemaFactory.createForClass(IdCard);
