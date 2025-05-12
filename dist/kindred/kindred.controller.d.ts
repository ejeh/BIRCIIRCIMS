import { KindredService } from './kindred.service';
import { UpdateKindredDto } from './kindredDto';
export declare class KindredController {
    private readonly kindredService;
    constructor(kindredService: KindredService);
    getPaginatedData(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./kindred.schema").Kindred, {}> & import("./kindred.schema").Kindred & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    getkindredHeads(userId: string, page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./kindred.schema").Kindred, {}> & import("./kindred.schema").Kindred & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    updateKindred(id: string, body: UpdateKindredDto): Promise<any>;
    deleteItem(item: string): Promise<any>;
}
