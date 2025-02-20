import { Schema, Document } from 'mongoose';
export declare class SchoolInfo extends Document {
    name: string;
    address: string;
    yearOfAttendance: string;
}
export declare const SchoolInfoSchema: Schema<SchoolInfo, import("mongoose").Model<SchoolInfo, any, any, any, Document<unknown, any, SchoolInfo> & SchoolInfo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, SchoolInfo, Document<unknown, {}, import("mongoose").FlatRecord<SchoolInfo>> & import("mongoose").FlatRecord<SchoolInfo> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export declare class TertiaryInfo extends Document {
    name: string;
    address: string;
    certificateObtained: string;
    matricNo: string;
    yearOfAttendance: string;
}
export declare const TertiaryInfoSchema: Schema<TertiaryInfo, import("mongoose").Model<TertiaryInfo, any, any, any, Document<unknown, any, TertiaryInfo> & TertiaryInfo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, TertiaryInfo, Document<unknown, {}, import("mongoose").FlatRecord<TertiaryInfo>> & import("mongoose").FlatRecord<TertiaryInfo> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
export declare class EducationalHistory extends Document {
    primarySchool: SchoolInfo;
    secondarySchool: SchoolInfo;
    tertiaryInstitutions: TertiaryInfo[];
}
export declare const EducationalHistorySchema: Schema<EducationalHistory, import("mongoose").Model<EducationalHistory, any, any, any, Document<unknown, any, EducationalHistory> & EducationalHistory & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, EducationalHistory, Document<unknown, {}, import("mongoose").FlatRecord<EducationalHistory>> & import("mongoose").FlatRecord<EducationalHistory> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
