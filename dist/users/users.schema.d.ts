import * as mongoose from 'mongoose';
import { UserPublicData } from './users.dto';
import { Document } from 'mongoose';
import { UserRole } from './users.role.enum';
import { NextOfKin } from './users.next-of-kin.schema';
import { EmploymentHistory } from './users.emploment.schema';
import { Business } from './users.business.schema';
import { EducationalHistory } from './users.education.schema';
import { HealthInfo } from './users.health.schema';
import { Neighbor } from './users.neigbour.schema';
import { Family } from './users.family.schema';
export type UserMethods = {
    getPublicData: () => UserPublicData;
};
export type UserDocument = User & Document & UserMethods;
export declare class User {
    email: string;
    firstname: string;
    lastname: string;
    middlename?: string;
    isActive: boolean;
    DOB?: Date;
    maritalStatus?: string;
    gender?: string;
    nationality?: string;
    stateOfOrigin?: string;
    lgaOfOrigin?: string;
    stateOfResidence?: string;
    lgaOfResidence?: string;
    house_number?: string;
    street_name?: string;
    nearest_bus_stop_landmark?: string;
    city_town?: string;
    countryOfResidence?: string;
    identification?: string;
    id_number?: string;
    issue_date?: string;
    expiry_date?: string;
    passportPhoto: string;
    nextOfKin?: NextOfKin[];
    employmentHistory?: EmploymentHistory[];
    business?: Business[];
    educationalHistory?: EducationalHistory;
    healthInfo?: HealthInfo[];
    neighbor?: Neighbor[];
    family?: Family[];
    phone: string;
    NIN: string;
    role?: UserRole;
    religion?: string;
    community?: string;
    password: string;
    isVerified: boolean;
    passwordResetToken: string;
    activationToken: string;
    activationExpires: Date;
}
export declare const UserSchema: mongoose.Schema<User, mongoose.Model<User, any, any, any, mongoose.Document<unknown, any, User, any> & User & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, User, mongoose.Document<unknown, {}, mongoose.FlatRecord<User>, {}> & mongoose.FlatRecord<User> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>;
