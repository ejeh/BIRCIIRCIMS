import { IndigeneCertificateService } from './indigene-certificate.service';
import { Response } from 'express';
import { Certificate } from './indigene-certicate.schema';
import { UsersService } from 'src/users/users.service';
export declare class IndigeneCertificateController {
    private readonly indigeneCertificateService;
    private readonly userService;
    constructor(indigeneCertificateService: IndigeneCertificateService, userService: UsersService);
    createCertificate(body: any, files: Array<Express.Multer.File>): Promise<Certificate>;
    downloadTemplate(id: string, res: Response): Promise<{
        message: string;
        url: string;
    }>;
    uploadAttestation(id: string, file: Express.Multer.File): Promise<import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    downloadCertificate(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    private loadHtmlTemplate;
    private populateHtmlTemplate;
    private markCertificateAsDownloaded;
    private generateQrCode;
    getCertsRequest(req: Request): Promise<(import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    approveCert(id: string, Body: any): Promise<Certificate>;
    rejectCert(id: string, rejectionReason: string): Promise<Certificate>;
    resubmitRequest(id: string, updatedData: any): Promise<Certificate>;
    getPaginatedData(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    getApprovedCert(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    getRequestsByStatuses(page?: number, limit?: number, statuses?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, Certificate, {}> & Certificate & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    getCert(id: string, body: any): Promise<Certificate>;
    getProfile(id: string, body: any): Promise<Certificate>;
    getUserProfile(id: string, body: any): Promise<Certificate>;
    deleteItem(item: string): Promise<any>;
    getPdf(filename: string, res: Response, req: any): void;
}
