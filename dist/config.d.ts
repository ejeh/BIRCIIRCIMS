declare const _default: {
    isDev: typeof isDev;
    isProd: typeof isProd;
    isTest: typeof isTest;
    host: string;
    port: string;
    db: string;
    mail: {
        from: {
            name: string;
            address: string;
        };
    };
    cors: {
        origin: string;
        methods: string;
        allowedHeaders: string;
        preflightContinue: boolean;
        optionsSuccessStatus: number;
    };
    auth: {
        jwtTokenExpireInSec: string;
        passwordResetExpireInMs: number;
        activationExpireInMs: number;
        saltRounds: number;
        secret: string;
    };
    static: {
        maxAge: string | number;
    };
};
export default _default;
export declare const dbUrl: string;
declare function isDev(): boolean;
declare function isProd(): boolean;
declare function isTest(): boolean;
