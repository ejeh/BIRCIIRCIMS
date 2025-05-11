import { Document } from 'mongoose';
export declare class Neighbor extends Document {
    name?: string;
    address?: string;
    phone?: string;
}
export declare const NeighborSchema: import("mongoose").Schema<Neighbor, import("mongoose").Model<Neighbor, any, any, any, Document<unknown, any, Neighbor, any> & Neighbor & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Neighbor, Document<unknown, {}, import("mongoose").FlatRecord<Neighbor>, {}> & import("mongoose").FlatRecord<Neighbor> & Required<{
    _id: unknown;
}> & {
    __v: number;
}>;
