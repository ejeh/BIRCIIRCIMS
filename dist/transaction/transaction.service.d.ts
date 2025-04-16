import mongoose, { Model } from 'mongoose';
import { Transaction } from './transaction.schema';
import { IndigeneCertificateService } from 'src/indigene-certificate/indigene-certificate.service';
export declare class TransactionService {
    private readonly transactionModel;
    private readonly indigeneCertificateService;
    constructor(transactionModel: Model<Transaction>, indigeneCertificateService: IndigeneCertificateService);
    private readonly baseUrl;
    private readonly secretKey;
    initializePayment(data: {
        certificateId: string;
        cardId: string;
        userId: string;
        amount: number;
        email: string;
        currency?: string;
        reference?: string;
        paymentType: 'card' | 'certificate';
    }): Promise<{
        status: number;
        message: string;
        data: {
            reference: string;
        };
    }>;
    verifyPayment(reference: string): Promise<any>;
    getUserTransactions(userId: string): Promise<(mongoose.Document<unknown, {}, Transaction> & Transaction & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getPaginatedData(page: number, limit: number): Promise<{
        data: (mongoose.Document<unknown, {}, Transaction> & Transaction & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    getApprovedItems(): Promise<any[]>;
    handleCredoWebhook(payload: any): Promise<{
        status: string;
        reason: string;
        event?: undefined;
    } | {
        status: string;
        event: any;
        reason?: undefined;
    }>;
}
