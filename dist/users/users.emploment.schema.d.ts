import { Schema, Document } from 'mongoose';
export declare const EmploymentHistorySchema: Schema<any, import("mongoose").Model<any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    address: string;
    companyName: string;
    designation: string;
    startYear: number;
    isCurrentEmployment: boolean;
    description?: string;
    endYear?: number;
}, Document<unknown, {}, import("mongoose").FlatRecord<{
    address: string;
    companyName: string;
    designation: string;
    startYear: number;
    isCurrentEmployment: boolean;
    description?: string;
    endYear?: number;
}>, {}> & import("mongoose").FlatRecord<{
    address: string;
    companyName: string;
    designation: string;
    startYear: number;
    isCurrentEmployment: boolean;
    description?: string;
    endYear?: number;
}> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
export interface EmploymentHistory extends Document {
    companyName: string;
    address: string;
    designation: string;
    startYear: number;
    endYear?: number;
    isCurrentEmployment: boolean;
    description?: string;
}
