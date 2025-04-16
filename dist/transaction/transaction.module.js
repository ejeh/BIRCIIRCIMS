"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModule = void 0;
const common_1 = require("@nestjs/common");
const transaction_controller_1 = require("./transaction.controller");
const transaction_service_1 = require("./transaction.service");
const mongoose_1 = require("@nestjs/mongoose");
const transaction_schema_1 = require("./transaction.schema");
const indigene_certificate_service_1 = require("../indigene-certificate/indigene-certificate.service");
const indigene_certicate_schema_1 = require("../indigene-certificate/indigene-certicate.schema");
const kindred_model_1 = require("../kindred/kindred.model");
const users_model_1 = require("../users/users.model");
let TransactionModule = class TransactionModule {
};
exports.TransactionModule = TransactionModule;
exports.TransactionModule = TransactionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            kindred_model_1.KindredModel,
            users_model_1.UserModel,
            mongoose_1.MongooseModule.forFeature([{ name: 'Certificate', schema: indigene_certicate_schema_1.Certificate }]),
            mongoose_1.MongooseModule.forFeature([
                { name: 'Transaction', schema: transaction_schema_1.TransactionSchema },
            ]),
        ],
        controllers: [transaction_controller_1.TransactionController],
        providers: [transaction_service_1.TransactionService, indigene_certificate_service_1.IndigeneCertificateService],
    })
], TransactionModule);
//# sourceMappingURL=transaction.module.js.map