import { IdcardService } from './idcard.service';
import { UsersService } from 'src/users/users.service';
import { Response } from 'express';
import { IdCard } from './idcard.schema';
export declare class IdcardController {
    private readonly idcardService;
    private readonly userService;
    constructor(idcardService: IdcardService, userService: UsersService);
    createIdCard(body: any, files: Array<Express.Multer.File>): Promise<IdCard>;
    getRequestsByStatuses(page?: number, limit?: number, statuses?: string): Promise<{
        data: (import("mongoose").Document<unknown, {}, IdCard, {}> & IdCard & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    approveCert(id: string, Body: any): Promise<IdCard>;
    rejectCert(id: string, rejectionReason: string): Promise<IdCard>;
    getUserProfile(id: string, body: any): Promise<IdCard>;
    deleteItem(item: string): Promise<any>;
    downloadCertificate(id: string, res: Response): Promise<Response<any, Record<string, any>>>;
    private generateSecureHash;
    private loadHtmlTemplate;
    private populateHtmlTemplate;
    private markCertificateAsDownloaded;
    private generateQrCode;
    getProfile(id: string, body: any): Promise<IdCard>;
    resubmitRequest(id: string, updatedData: any): Promise<IdCard>;
    getCert(id: string, body: any): Promise<IdCard>;
    getPdf(filename: string, res: Response, req: any): void;
    verify(id: string, hash: string, res: Response): Promise<void>;
}
