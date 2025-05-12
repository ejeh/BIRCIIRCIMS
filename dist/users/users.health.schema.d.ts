import { Document } from 'mongoose';
export declare enum BloodGroup {
    A_POSITIVE = "A+",
    A_NEGATIVE = "A-",
    B_POSITIVE = "B+",
    B_NEGATIVE = "B-",
    AB_POSITIVE = "AB+",
    AB_NEGATIVE = "AB-",
    O_POSITIVE = "O+",
    O_NEGATIVE = "O-"
}
export declare enum Genotype {
    AA = "AA",
    AS = "AS",
    SS = "SS",
    AC = "AC"
}
export declare enum DisabilityStatus {
    NONE = "None",
    PHYSICAL = "Physical",
    VISUAL = "Visual",
    HEARING = "Hearing",
    MENTAL = "Mental",
    OTHER = "Other"
}
export declare class HealthInfo extends Document {
    bloodGroup: BloodGroup;
    genotype: Genotype;
    disabilityStatus: DisabilityStatus;
}
export declare const HealthInfoSchema: import("mongoose").Schema<HealthInfo, import("mongoose").Model<HealthInfo, any, any, any, Document<unknown, any, HealthInfo, any> & HealthInfo & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, HealthInfo, Document<unknown, {}, import("mongoose").FlatRecord<HealthInfo>, {}> & import("mongoose").FlatRecord<HealthInfo> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
