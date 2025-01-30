import { Document } from 'mongoose';
export declare class Business extends Document {
    biz_name?: string;
    biz_type?: string;
    registration_number?: string;
    biz_address?: string;
    nature_of_bussiness?: string;
    numberOfYears?: string;
    numberOfEmployees?: string;
    annualRevenue?: string;
    TIN?: string;
    biz_phone?: string;
    biz_email?: string;
}
export declare const BusinessSchema: import("mongoose").Schema<Business, import("mongoose").Model<Business, any, any, any, Document<unknown, any, Business> & Business & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Business, Document<unknown, {}, import("mongoose").FlatRecord<Business>> & import("mongoose").FlatRecord<Business> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
