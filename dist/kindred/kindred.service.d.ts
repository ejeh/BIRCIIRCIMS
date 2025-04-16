import { Kindred } from './kindred.schema';
import { Model } from 'mongoose';
export declare class KindredService {
    private readonly kindredModel;
    constructor(kindredModel: Model<Kindred>);
    createKindred: (payload: {
        userId: string;
        firstname: string;
        lastname: string;
        address: string;
        phone: number;
        kindred: string;
        lga: string;
        stateOfOrigin: string;
        email: string;
    }) => Promise<any>;
    getPaginatedData(page: number, limit: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, Kindred> & Kindred & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    getkindredHeads(userId: string, page: number, limit: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, Kindred> & Kindred & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    updateKindred(id: string, updatedData: any): Promise<any>;
    deleteItem: (item_id: string) => Promise<any>;
}
