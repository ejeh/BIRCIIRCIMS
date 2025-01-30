"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndigeneCertificateModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const indigene_certificate_controller_1 = require("./indigene-certificate.controller");
const indigene_certificate_service_1 = require("./indigene-certificate.service");
const indigene_certicate_schema_1 = require("./indigene-certicate.schema");
const users_swagger_1 = require("../users/users.swagger");
const users_service_1 = require("../users/users.service");
const users_mailer_service_1 = require("../users/users.mailer.service");
const users_model_1 = require("../users/users.model");
let IndigeneCertificateModule = class IndigeneCertificateModule {
};
exports.IndigeneCertificateModule = IndigeneCertificateModule;
exports.IndigeneCertificateModule = IndigeneCertificateModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_model_1.UserModel,
            mongoose_1.MongooseModule.forFeature([
                { name: indigene_certicate_schema_1.Certificate.name, schema: indigene_certicate_schema_1.CertificateSchema },
            ]),
        ],
        controllers: [indigene_certificate_controller_1.IndigeneCertificateController],
        providers: [indigene_certificate_service_1.IndigeneCertificateService, users_service_1.UsersService, users_mailer_service_1.UserMailerService],
        exports: [indigene_certificate_service_1.IndigeneCertificateService],
    })
], IndigeneCertificateModule);
(0, users_swagger_1.default)(IndigeneCertificateModule);
//# sourceMappingURL=indigene-certificate.module.js.map