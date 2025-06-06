import { Schema, Document, Types } from 'mongoose';

export interface Transaction extends Document {
  userId: Types.ObjectId;
  certificateId: Types.ObjectId;
  cardId: Types.ObjectId;
  reference: string;
  amount: number;
  email: string;
  status: string;
  currency: string;
  createdAt: Date;
  paymentType: 'card' | 'certificate';
  customer?: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phoneNo?: string;
  };

  verified?: boolean;
}

export const TransactionSchema = new Schema<Transaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // Link to User model

    cardId: {
      type: Schema.Types.ObjectId,
      ref: 'IdCard',
      required: function () {
        return this.paymentType === 'card';
      },
    }, // Link to Certificate model, required if paymentType is 'certificate'

    certificateId: {
      type: Schema.Types.ObjectId,
      ref: 'Certificate',
      required: function () {
        return this.paymentType === 'certificate';
      },
    }, // Link to Certificate model, required if paymentType is 'certificate'

    reference: { type: String, unique: true },
    amount: { type: Number, required: true },
    email: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },

    currency: { type: String, default: 'NGN' },

    paymentType: {
      type: String,
      required: true,
      enum: ['card', 'certificate'],
    }, // ✅ New field to determine payment type

    customer: {
      firstname: String,
      lastname: String,
      email: String,
      phoneNo: String,
    },
    verified: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
