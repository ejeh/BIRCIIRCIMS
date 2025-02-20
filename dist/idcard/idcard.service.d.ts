import { Model } from 'mongoose';
import { IdCard } from './idcard.schema';
export declare class IdcardService {
    readonly idCardModel: Model<IdCard>;
    constructor(idCardModel: Model<IdCard>);
    generateUniqueNumber(): Promise<string>;
    generateUniqueBIN(): Promise<string>;
    createIdCard(data: Partial<IdCard>): Promise<IdCard>;
    findCardById(id: string): Promise<IdCard>;
    findById(id: string): Promise<IdCard>;
    findOne(id: string): Promise<IdCard>;
    findCardRequestsByStatuses(page: number, limit: number, statuses: string[]): Promise<{
        data: (import("mongoose").Document<unknown, {}, IdCard> & IdCard & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    approveIdCard(id: string): Promise<IdCard>;
    rejectCard(id: string, rejectionReason: string): Promise<IdCard>;
    deleteItem: (item_id: string) => Promise<any>;
    findCertificateById(id: string): Promise<IdCard>;
    markAsDownloaded(id: string): Promise<void>;
    generateIDCardPDF(id: string, html: string): Promise<string>;
    resubmitRequest(id: string, updatedData: Partial<IdCard>): Promise<IdCard>;
}
