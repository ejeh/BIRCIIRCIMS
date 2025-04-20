import { TransactionService } from './transaction.service';
export declare class TransactionController {
    private readonly transactionService;
    constructor(transactionService: TransactionService);
    initializePayment(data: {
        certificateId: string;
        cardId: string;
        userId: string;
        amount: number;
        email: string;
        paymentType: 'card' | 'certificate';
    }): Promise<{
        status: number;
        message: string;
        data: {
            reference: string;
        };
    }>;
    handleCredoWebhook(req: Request, res: import('express').Response): Promise<import("express").Response<any, Record<string, any>>>;
    getApprovedItems(): Promise<any[]>;
    verifyPayment(reference: string): Promise<any>;
    getUserTransactions(userId: string): Promise<(import("mongoose").Document<unknown, {}, import("./transaction.schema").Transaction> & import("./transaction.schema").Transaction & Required<{
        _id: unknown;
    }> & {
        __v: number;
    })[]>;
    getPaginatedData(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./transaction.schema").Transaction> & import("./transaction.schema").Transaction & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
}
