import { Schema, Document, Types } from 'mongoose';

export interface Kindred extends Document {
  userId: Types.ObjectId;
  email: string;
  firstname: string;
  lastname: string;
  address: string;
  phone: string;
  kindred: string;
  lga: string;
  middlename: string;
  stateOfOrigin: string;
  createdAt: Date;
}

export const KindredSchema = new Schema<Kindred>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    }, // Link to User model
    email: { type: String, required: true },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    middlename: { type: String },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    kindred: {
      type: String,
      required: true,
    },
    lga: {
      type: String,
      required: true,
    },
    stateOfOrigin: {
      type: String,
      required: true,
    },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);
