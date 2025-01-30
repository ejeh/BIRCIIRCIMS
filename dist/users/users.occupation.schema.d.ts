import { Document } from 'mongoose';
export declare class Occupation extends Document {
    current_occupation?: string;
    employer_name?: string;
    employer_address?: string;
    employment_status?: string;
}
export declare const OccupationSchema: import("mongoose").Schema<Occupation, import("mongoose").Model<Occupation, any, any, any, Document<unknown, any, Occupation> & Occupation & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Occupation, Document<unknown, {}, import("mongoose").FlatRecord<Occupation>> & import("mongoose").FlatRecord<Occupation> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
