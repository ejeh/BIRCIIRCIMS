import { Document } from 'mongoose';
export declare class Family extends Document {
    name?: string;
    relationship?: string;
    phone?: string;
    address?: string;
}
export declare const FamilySchema: import("mongoose").Schema<Family, import("mongoose").Model<Family, any, any, any, Document<unknown, any, Family, any> & Family & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Family, Document<unknown, {}, import("mongoose").FlatRecord<Family>, {}> & import("mongoose").FlatRecord<Family> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
