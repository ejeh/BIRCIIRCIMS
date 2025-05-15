import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
export declare class Certificate extends Document {
    userId: string;
    status: string;
    rejectionReason?: string;
    resubmissionAllowed: boolean;
    resubmissionAttempts: number;
    downloaded: Boolean;
    email: string;
    firstname: string;
    lastname: string;
    middlename: string;
    DOB: Date;
    maritalStatus: string;
    gender: string;
    stateOfOrigin: string;
    lgaOfOrigin: string;
    ward: string;
    address: string;
    phone: number;
    kindred: string;
    fathersName: string;
    fathersStateOfOrigin: string;
    mothersName: string;
    mothersStateOfOrigin: string;
    guardian?: string;
    relationshionToguardian?: string;
    purpose?: string;
    refNumber: String;
    passportPhoto: string;
    idCard: string;
    birthCertificate: string;
    parentGuardianIndigeneCert: string;
    uploadedAttestationUrl: string;
    qrCodeUrl?: string;
    issuingAuthority: string;
    isValid: boolean;
    verificationHash: string;
}
export declare const CertificateSchema: mongoose.Schema<Certificate, mongoose.Model<Certificate, any, any, any, mongoose.Document<unknown, any, Certificate, any> & Certificate & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, Certificate, mongoose.Document<unknown, {}, mongoose.FlatRecord<Certificate>, {}> & mongoose.FlatRecord<Certificate> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
