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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const auth_1 = require("../auth/auth");
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../config"));
const users_mailer_service_1 = require("./users.mailer.service");
const exception_1 = require("../common/exception");
let UsersService = class UsersService {
    constructor(userModel, userMailer) {
        this.userModel = userModel;
        this.userMailer = userMailer;
    }
    async create(firstname, lastname, email, password, phone, NIN, role, origin) {
        try {
            const user = await this.userModel.create({
                email: email.toLocaleLowerCase(),
                firstname,
                lastname,
                phone,
                NIN,
                role,
                origin,
                password: await (0, auth_1.hashPassword)(password),
                activationToken: (0, uuid_1.v4)(),
                activationExpires: Date.now() + config_1.default.auth.activationExpireInMs,
            });
            this.userMailer.sendActivationMail(user.email, user.id, user.activationToken, origin);
            return user;
        }
        catch (error) {
            throw (0, exception_1.EmailAlreadyUsedException)();
        }
    }
    async findById(id) {
        const user = await this.userModel.findById(id);
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        return user;
    }
    async findByEmail(email) {
        const user = await this.userModel.findOne({ email: email.toLowerCase() }, '+password');
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        return user;
    }
    async activate(userId, activationToken) {
        const user = await this.userModel
            .findOneAndUpdate({
            _id: userId,
            activationToken,
        }, {
            activationToken: null,
            activationExpires: null,
            isActive: true,
        }, {
            new: true,
            runValidators: true,
        })
            .where('activationExpires')
            .gt(Date.now())
            .exec();
        return user;
    }
    async resendActivationEmail(email) {
        const user = await this.userModel.findOne({ email });
        const activationToken = user.activationToken || Math.random().toString(36).substr(2, 10);
        user.activationToken = activationToken;
        await user.save();
        this.userMailer.sendActivationMail(user.email, user.id, user.activationToken, origin);
        return { success: true, message: 'Activation email sent successfully' };
    }
    async forgottenPassword(email, origin) {
        const user = await this.userModel.findOneAndUpdate({
            email: email.toLowerCase(),
        }, {
            passwordResetToken: (0, uuid_1.v4)(),
            passwordResetExpires: Date.now() + config_1.default.auth.passwordResetExpireInMs,
        }, {
            new: true,
            runValidators: true,
        });
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        this.userMailer.sendForgottenPasswordMail(user.email, user.passwordResetToken, origin);
    }
    async resetPassword(email, passwordResetToken, password) {
        const user = await this.userModel
            .findOneAndUpdate({
            email: email.toLowerCase(),
            passwordResetToken,
        }, {
            password: await (0, auth_1.hashPassword)(password),
            passwordResetToken: undefined,
            passwordResetExpires: undefined,
        }, {
            new: true,
            runValidators: true,
        })
            .where('passwordResetExpires')
            .gt(Date.now())
            .exec();
        if (!user) {
            throw (0, exception_1.PasswordResetTokenInvalidException)();
        }
        this.userMailer.sendResetPasswordMail(user.email);
        return user;
    }
    async getPaginatedData(page, limit) {
        const skip = (page - 1) * limit;
        const data = await this.userModel.find().skip(skip).limit(limit).exec();
        const totalCount = await this.userModel.countDocuments().exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async sendRequest(email, subject, body) {
        const user = await this.userModel.findOne({ email: email.toLowerCase() }, '+password');
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        this.userMailer.sendMailRequest(user.email, subject, body);
        return user;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('User')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_mailer_service_1.UserMailerService])
], UsersService);
//# sourceMappingURL=users.service.js.map