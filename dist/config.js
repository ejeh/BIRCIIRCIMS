"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NODE_ENV = exports.dbUrl = void 0;
const VALID_ENVIRONMENTS = ['development', 'production', 'test'];
const NODE_ENV = (() => {
    const env = process.env.NODE_ENV;
    if (!env) {
        const isInLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;
        console.warn(`NODE_ENV not set! Defaulting to ${isInLambda ? 'production' : 'development'}`);
        return isInLambda ? 'production' : 'development';
    }
    if (!VALID_ENVIRONMENTS.includes(env)) {
        throw new Error(`Invalid NODE_ENV: ${env}. Must be one of: ${VALID_ENVIRONMENTS.join(', ')}`);
    }
    return env;
})();
exports.NODE_ENV = NODE_ENV;
const isDev = NODE_ENV === 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';
console.log(`Current Environment: ${NODE_ENV}`);
const config = {
    isDev,
    isProd,
    isTest,
    nodeEnv: NODE_ENV,
    host: process.env.API_HOST,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    db: process.env.MONGO_URL,
    mail: {
        from: {
            name: process.env.MAIL_FROM_NAME,
            address: process.env.MAIL_FROM_ADDRESS,
        },
    },
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: (process.env.CORS_METHODS || 'POST,GET,PUT,OPTIONS,DELETE,PATCH')
            .split(',')
            .map(method => method.trim()),
        allowedHeaders: [
            'Timezone-Offset',
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'authorization',
            ...(process.env.EXTRA_CORS_HEADERS ? process.env.EXTRA_CORS_HEADERS.split(',') : []),
            '*',
        ].join(','),
        preflightContinue: false,
        optionsSuccessStatus: 200,
    },
    auth: {
        jwtTokenExpireInSec: process.env.JWT_EXPIRATION || '100d',
        passwordResetExpireInMs: parseInt(process.env.PASSWORD_RESET_EXPIRATION || '3600000', 10),
        activationExpireInMs: parseInt(process.env.ACTIVATION_EXPIRATION || '86400000', 10),
        saltRounds: parseInt(process.env.SALT_ROUNDS || '10', 10),
        secret: process.env.AUTH_SECRET || 'secret',
    },
    static: {
        maxAge: isProd ? '1d' : 0,
    },
};
const dbUrl = config.db;
exports.dbUrl = dbUrl;
exports.default = config;
//# sourceMappingURL=config.js.map