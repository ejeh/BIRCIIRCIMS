import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
export declare class IdCard extends Document {
    userId: string;
    firstname: string;
    lastname: string;
    email: string;
    status: string;
    rejectionReason?: string;
    resubmissionAllowed: boolean;
    resubmissionAttempts: number;
    downloaded: Boolean;
    card_type: string;
    dateOfIssue: Date;
    dateOfExpiration: Date;
    ref_letter: string;
    utilityBill: string;
    phone: number;
    qrCodeUrl?: string;
    bin?: string;
    isValid: boolean;
    verificationHash: string;
}
export declare const IdCardSchema: mongoose.Schema<IdCard, mongoose.Model<IdCard, any, any, any, mongoose.Document<unknown, any, IdCard, any> & IdCard & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, IdCard, mongoose.Document<unknown, {}, mongoose.FlatRecord<IdCard>, {}> & mongoose.FlatRecord<IdCard> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
