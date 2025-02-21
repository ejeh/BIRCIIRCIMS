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
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const users_module_1 = require("../users/users.module");
const jwt_1 = require("@nestjs/jwt");
const config_1 = __importDefault(require("../config"));
const passport_1 = require("@nestjs/passport");
const jwt_auth_guard_1 = require("./jwt-auth.guard");
const jwt_strategy_1 = require("./jwt.strategy");
const localstrategy_1 = require("./localstrategy");
const users_mailer_service_1 = require("../users/users.mailer.service");
const users_service_1 = require("../users/users.service");
const users_model_1 = require("../users/users.model");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            users_module_1.UsersModule,
            users_model_1.UserModel,
            jwt_1.JwtModule.register({
                secret: config_1.default.auth.secret,
                signOptions: {},
            }),
            passport_1.PassportModule,
        ],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            jwt_auth_guard_1.JwtAuthGuard,
            jwt_strategy_1.JwtStrategy,
            localstrategy_1.LocalStrategy,
            users_mailer_service_1.UserMailerService,
            users_service_1.UsersService,
        ],
        exports: [auth_service_1.AuthService, jwt_auth_guard_1.JwtAuthGuard],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map