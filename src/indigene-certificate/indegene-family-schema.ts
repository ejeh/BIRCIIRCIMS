// // next-of-kin.schema.ts
// import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
// import { Document } from 'mongoose';

// export enum VerificationStatus {
//   PENDING = 'pending',
//   VERIFIED = 'verified',
//   DENIED = 'denied',
//   EXPIRED = 'expired', // Add this
// }

// @Schema({ _id: false })
// @Schema({ timestamps: true })
// export class Family extends Document {
//   @Prop({ required: false, default: null })
//   name?: string;

//   @Prop({ required: false, default: null })
//   relationship?: string;

//   @Prop({ required: false, default: null })
//   phone?: string;

//   @Prop({ required: false, default: null })
//   address?: string;

//   // Verification fields
//   @Prop({ default: VerificationStatus.PENDING })
//   status: VerificationStatus;

//   @Prop()
//   verificationToken?: string;

//   @Prop()
//   verificationLink?: string;

//   @Prop()
//   verificationExpiresAt?: Date;

//   @Prop()
//   deviceInfo?: string;

//   @Prop({ default: false })
//   isFollowUpSent: boolean;

//   @Prop()
//   verifiedAt?: Date;
//   @Prop({ required: false })
//   knowsApplicant?: boolean;

//   @Prop({ required: false })
//   knownDuration?: string;

//   @Prop({ required: false })
//   isResident?: boolean;

//   @Prop({ required: false })
//   comments?: string;

//   @Prop()
//   updatedAt?: Date;
// }

// export const FamilySchema = SchemaFactory.createForClass(Family);
