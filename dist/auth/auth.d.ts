import { Request } from 'express';
export declare const hashPassword: (password: string) => Promise<any>;
export declare const comparePassword: (password: string, hash: string) => any;
export declare const getOriginHeader: ({ headers: { origin } }: Request) => string;
