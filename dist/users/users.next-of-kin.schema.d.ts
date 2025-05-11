import { Document } from 'mongoose';
export declare class NextOfKin extends Document {
    nok_surname?: string;
    nok_firstname?: string;
    nok_middlename?: string;
    nok_relationship?: string;
    nok_countryOfResidence?: string;
    nok_stateOfResidence?: string;
    nok_lgaOfResidence?: string;
    nok_cityOfResidence?: string;
    nok_address?: string;
}
export declare const NextOfKinSchema: import("mongoose").Schema<NextOfKin, import("mongoose").Model<NextOfKin, any, any, any, Document<unknown, any, NextOfKin, any> & NextOfKin & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, NextOfKin, Document<unknown, {}, import("mongoose").FlatRecord<NextOfKin>, {}> & import("mongoose").FlatRecord<NextOfKin> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
