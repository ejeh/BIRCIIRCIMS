import { Schema, Document, Types } from 'mongoose';

export interface Transaction extends Document {
  userId: Types.ObjectId;
  certificateId: Types.ObjectId;
  cardId: Types.ObjectId;
  auctioneerId: Types.ObjectId;
  reference: string;
  rrr: string;
  amount: number;
  documentAmount: number;
  totalAmount: number;
  email: string;
  status: string;
  currency: string;
  createdAt: Date;
  verifiedAt: Date;
  paymentType: 'card' | 'certificate' | 'reprint' | 'auctioneer';
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

    auctioneerId: {
      type: Schema.Types.ObjectId,
      ref: 'Auctioneer',
      required: function () {
        return this.paymentType === 'auctioneer';
      },
    }, // Link to Auctioneer model, required if paymentType is 'auctioneer'

    reference: { type: String, unique: true, required: true },
    amount: { type: Number, required: true },
    documentAmount: { type: Number, required: true },
    totalAmount: { type: Number, required: true },

    email: { type: String, required: true },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'service_paid', 'success', 'failed', 'expired'],
      default: 'pending',
    },

    currency: { type: String, default: 'NGN' },

    paymentType: {
      type: String,
      required: true,
      enum: ['card', 'certificate', 'reprint', 'auctioneer'],
    }, // ✅ New field to determine payment type

    customer: {
      firstname: String,
      lastname: String,
      email: String,
      phoneNo: String,
    },
    verified: { type: Boolean, default: false },

    rrr: { type: String, unique: true, sparse: true },

    createdAt: { type: Date, default: Date.now },
    verifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
TransactionSchema.index({
  userId: 1,
  documentId: 1,
  documentType: 1,
  paymentType: 1,
  status: 1,
});
