declare const VALID_ENVIRONMENTS: readonly ["development", "production", "test"];
type NodeEnv = (typeof VALID_ENVIRONMENTS)[number];
declare const NODE_ENV: NodeEnv;
declare const config: {
    isDev: boolean;
    isProd: boolean;
    isTest: boolean;
    nodeEnv: "development" | "production" | "test";
    host: string;
    port: number;
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
declare const dbUrl: string;
export default config;
export { dbUrl, NODE_ENV };
