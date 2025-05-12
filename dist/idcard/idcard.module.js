"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdcardModule = void 0;
const common_1 = require("@nestjs/common");
const idcard_controller_1 = require("./idcard.controller");
const idcard_service_1 = require("./idcard.service");
const users_model_1 = require("../users/users.model");
const mongoose_1 = require("@nestjs/mongoose");
const idcard_schema_1 = require("./idcard.schema");
const users_swagger_1 = __importDefault(require("../users/users.swagger"));
const users_service_1 = require("../users/users.service");
const users_mailer_service_1 = require("../users/users.mailer.service");
let IdcardModule = class IdcardModule {
};
exports.IdcardModule = IdcardModule;
exports.IdcardModule = IdcardModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_model_1.UserModel,
            mongoose_1.MongooseModule.forFeature([{ name: idcard_schema_1.IdCard.name, schema: idcard_schema_1.IdCardSchema }]),
        ],
        controllers: [idcard_controller_1.IdcardController],
        providers: [idcard_service_1.IdcardService, users_service_1.UsersService, users_mailer_service_1.UserMailerService],
        exports: [idcard_service_1.IdcardService],
    })
], IdcardModule);
(0, users_swagger_1.default)(IdcardModule);
//# sourceMappingURL=idcard.module.js.map