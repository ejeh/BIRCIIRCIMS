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
    verified: Boolean;
    createdAt: Date;
    paymentType: 'card' | 'certificate';
    customer: {
        name: string;
        email: string;
        phone: string;
    };
}
export declare const TransactionSchema: Schema<Transaction, import("mongoose").Model<Transaction, any, any, any, Document<unknown, any, Transaction> & Transaction & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Transaction, Document<unknown, {}, import("mongoose").FlatRecord<Transaction>> & import("mongoose").FlatRecord<Transaction> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
