"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const users_module_1 = require("./users/users.module");
const nest_morgan_1 = require("nest-morgan");
const mongoose_1 = require("@nestjs/mongoose");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const mailer_1 = require("@nestjs-modules/mailer");
const handlebars_adapter_1 = require("@nestjs-modules/mailer/dist/adapters/handlebars.adapter");
const serve_static_1 = require("@nest-middlewares/serve-static");
const path = __importStar(require("path"));
const logger_1 = require("./common/middleware/logger");
const auth_module_1 = require("./auth/auth.module");
const indigene_certificate_module_1 = require("./indigene-certificate/indigene-certificate.module");
const idcard_module_1 = require("./idcard/idcard.module");
const serve_static_2 = require("@nestjs/serve-static");
const path_1 = require("path");
const transaction_module_1 = require("./transaction/transaction.module");
const kindred_module_1 = require("./kindred/kindred.module");
const config_1 = __importStar(require("./config"));
const throttler_1 = require("@nestjs/throttler");
const helmet_1 = require("@nest-middlewares/helmet");
const notifications_module_1 = require("./notifications/notifications.module");
const sms_module_1 = require("./sms/sms.module");
const tasks_module_1 = require("./task/tasks.module");
const biometrics_module_1 = require("./biometrics/biometrics.module");
const mail_module_1 = require("./mail/mail.module");
const cloudinary_service_1 = require("./cloudinary/cloudinary.service");
const DEV_TRANSPORTER = {
    host: 'smtp-relay.sendinblue.com',
    port: 587,
    secure: false,
    auth: {
        user: 'developercircus@gmail.com',
        pass: 'CR2bIMjv3XZkrTEL',
    },
};
let AppModule = class AppModule {
    configure(consumer) {
        helmet_1.HelmetMiddleware.configure({});
        consumer.apply(helmet_1.HelmetMiddleware).forRoutes('*');
        serve_static_1.ServeStaticMiddleware.configure(path.resolve(__dirname, '..', '..', 'public'), config_1.default.static);
        consumer.apply(serve_static_1.ServeStaticMiddleware).forRoutes('public');
        if (!config_1.default.isTest) {
            consumer.apply(logger_1.LoggerMiddleware).forRoutes('api');
        }
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 10,
                },
            ]),
            users_module_1.UsersModule,
            nest_morgan_1.MorganModule,
            mongoose_1.MongooseModule.forRoot(config_1.dbUrl),
            serve_static_2.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', 'uploads'),
                serveRoot: '/uploads',
            }),
            jwt_1.JwtModule.register({
                secret: 'secret',
                signOptions: { expiresIn: config_1.default.auth.jwtTokenExpireInSec },
            }),
            passport_1.PassportModule,
            mailer_1.MailerModule.forRootAsync({
                useFactory: () => ({
                    transport: DEV_TRANSPORTER,
                    defaults: {
                        from: config_1.default.mail.from,
                    },
                    template: {
                        dir: __dirname + '/../templates',
                        adapter: new handlebars_adapter_1.HandlebarsAdapter(),
                        options: {
                            strict: true,
                        },
                    },
                    options: {
                        partials: {
                            dir: path.join(__dirname, 'templates/partials'),
                            options: {
                                strict: true,
                            },
                        },
                    },
                    debug: true,
                }),
            }),
            auth_module_1.AuthModule,
            indigene_certificate_module_1.IndigeneCertificateModule,
            idcard_module_1.IdcardModule,
            transaction_module_1.TransactionModule,
            kindred_module_1.KindredModule,
            notifications_module_1.NotificationsModule,
            sms_module_1.SmsModule,
            tasks_module_1.TasksModule,
            biometrics_module_1.BiometricsModule,
            mail_module_1.MailModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, cloudinary_service_1.CloudinaryService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map