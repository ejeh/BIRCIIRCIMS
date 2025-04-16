"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbUrl = void 0;
const NODE_ENV = process.env.NODE_ENV || 'development';
const isDev = NODE_ENV === 'development';
const isProd = NODE_ENV === 'production';
const isTest = NODE_ENV === 'test';
console.log(`Current Environment: ${NODE_ENV}`);
const config = {
    isDev,
    isProd,
    isTest,
    host: process.env.API_HOST,
    port: process.env.PORT,
    db: process.env.MONGO_URL,
    mail: {
        from: {
            name: process.env.MAIL_FROM_NAME,
            address: process.env.MAIL_FROM_ADDRESS,
        },
    },
    cors: {
        origin: '*',
        methods: ['POST', 'GET', 'PUT', 'OPTIONS', 'DELETE', 'PATCH'],
        allowedHeaders: [
            'Timezone-Offset',
            'Origin',
            'X-Requested-With',
            'Content-Type',
            'Accept',
            'Authorization',
            'authorization',
            '*',
        ].join(','),
        preflightContinue: false,
        optionsSuccessStatus: 200,
    },
    auth: {
        jwtTokenExpireInSec: '100d',
        passwordResetExpireInMs: 60 * 60 * 1000,
        activationExpireInMs: 24 * 60 * 60 * 1000,
        saltRounds: 10,
        secret: process.env.AUTH_SECRET || 'secret',
    },
    static: {
        maxAge: isProd ? '1d' : 0,
    },
};
exports.default = config;
exports.dbUrl = config.db;
//# sourceMappingURL=config.js.map