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
export declare const KindredSchema: Schema<Kindred, import("mongoose").Model<Kindred, any, any, any, Document<unknown, any, Kindred, any> & Kindred & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Kindred, Document<unknown, {}, import("mongoose").FlatRecord<Kindred>, {}> & import("mongoose").FlatRecord<Kindred> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
