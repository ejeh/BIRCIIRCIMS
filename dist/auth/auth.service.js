"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const users_schema_1 = require("../users/users.schema");
const users_service_1 = require("../users/users.service");
const auth_1 = require("./auth");
const exception_1 = require("../common/exception");
const mongoose_1 = require("mongoose");
const users_mailer_service_1 = require("../users/users.mailer.service");
const mongoose_2 = require("@nestjs/mongoose");
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
let AuthService = class AuthService {
    constructor(userModel, userMailer, usersService, jwtService) {
        this.userModel = userModel;
        this.userMailer = userMailer;
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        const user = await this.usersService.findByEmail(email);
        if (!(0, auth_1.comparePassword)(password, user.password)) {
            throw (0, exception_1.LoginCredentialsException)();
        }
        return user;
    }
    async activate({ userId, activationToken }) {
        const user = await this.usersService.activate(userId, activationToken);
        if (!user) {
            return { success: false, message: 'Invalid or expired token' };
        }
        return {
            success: true,
            message: 'Account activated successfully',
            token: this.jwtService.sign({ id: user.id }, { subject: `${user.id}` }),
            user: user.getPublicData(),
        };
    }
    async resendActivationEmail(email, origin) {
        const user = await this.userModel.findOne({ email });
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        if (user.isActive) {
            return { success: false, message: 'Account is already activated' };
        }
        const activationToken = user.activationToken || (0, uuid_1.v4)();
        user.activationToken = activationToken;
        (user.activationExpires = new Date(Date.now() + config_1.default.auth.activationExpireInMs)),
            await user.save();
        this.userMailer.sendActivationMail(user.email, user.id, user.activationToken, origin);
        return { success: true, message: 'Activation email sent successfully' };
    }
    async signUpUser(userData, origin, role) {
        const user = await this.usersService.create(userData.firstname, userData.lastname, userData.email, userData.password, userData.phone, userData.NIN, role, origin);
        return {
            token: this.jwtService.sign({ ...user.getPublicData() }, { subject: `${user.id}` }),
            user: user.getPublicData(),
        };
    }
    async login(user) {
        if (!user.isActive) {
            throw new common_1.UnauthorizedException('Account is not activated. Please check your email for activation instructions.');
        }
        return {
            token: this.jwtService.sign({ ...user?.getPublicData() }, { subject: `${user?.id}` }),
            user: user?.getPublicData(),
        };
    }
    async forgottenPassword({ email }, origin) {
        return await this.usersService.forgottenPassword(email, origin);
    }
    async resetPassword({ email, passwordResetToken, password, }) {
        const user = await this.usersService.resetPassword(email, passwordResetToken, password);
        return {
            token: this.jwtService.sign({}, { subject: `${user.id}` }),
            user: user.getPublicData(),
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)(users_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_1.Model,
        users_mailer_service_1.UserMailerService,
        users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map