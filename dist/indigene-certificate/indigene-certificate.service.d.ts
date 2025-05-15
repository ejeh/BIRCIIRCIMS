import { Model } from 'mongoose';
import { Response } from 'express';
import { Certificate } from './indigene-certicate.schema';
import { Kindred } from 'src/kindred/kindred.schema';
import { UserDocument } from 'src/users/users.schema';
export declare class IndigeneCertificateService {
    readonly certificateModel: Model<Certificate>;
    private readonly kindredModel;
    readonly userModel: Model<UserDocument>;
    constructor(certificateModel: Model<Certificate>, kindredModel: Model<Kindred>, userModel: Model<UserDocument>);
    createCertificate(data: Partial<Certificate>): Promise<Certificate>;
    findCertificateById(id: string): Promise<Certificate>;
    findOne(id: string): Promise<Certificate>;
    findById(id: string): Promise<Certificate>;
    findApprovedRequest(page: number, limit: number, status: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    findRequestsByStatuses(page: number, limit: number, statuses: string[]): Promise<{
        data: (import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    approveCertificate(id: string): Promise<Certificate>;
    rejectCertificate(id: string, rejectionReason: string): Promise<Certificate>;
    resubmitRequest(id: string, updatedData: Partial<Certificate>): Promise<Certificate>;
    getPaginatedData(page: number, limit: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    markAsDownloaded(id: string): Promise<void>;
    reverseMarkAsDownloaded(id: string): Promise<void>;
    getAttestationTemplate(id: string, res: Response): Promise<{
        message: string;
        url: string;
    }>;
    uploadAttestation(id: string, file: Express.Multer.File): Promise<import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    generateCertificatePDF(id: string, html: string): Promise<string>;
    deleteItem: (item_id: string) => Promise<any>;
    findByIds(ids: string[]): Promise<any[]>;
    verifyCertificate(certificateId: string, hash: string): Promise<any>;
    saveVerificationHash(certificateId: string, hash: string): Promise<import("mongoose").UpdateWriteOpResult>;
}
