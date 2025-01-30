import { Document } from 'mongoose';
export declare class EducationalBackground extends Document {
    highestEducationLevel: string;
    institutionAttended: string;
    graduationYear: number;
}
export declare const EducationalBackgroundSchema: import("mongoose").Schema<EducationalBackground, import("mongoose").Model<EducationalBackground, any, any, any, Document<unknown, any, EducationalBackground> & EducationalBackground & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EducationalBackground, Document<unknown, {}, import("mongoose").FlatRecord<EducationalBackground>> & import("mongoose").FlatRecord<EducationalBackground> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
