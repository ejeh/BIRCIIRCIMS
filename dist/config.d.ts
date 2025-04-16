declare const config: {
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
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
        methods: string[];
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
export default config;
export declare const dbUrl: string;
