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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const auth_interface_1 = require("./auth.interface");
const auth_1 = require("./auth");
const passport_1 = require("@nestjs/passport");
const config_1 = __importDefault(require("../config"));
const kindredDto_1 = require("../kindred/kindredDto");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async activate(params, res) {
        const getFrontendBaseUrl = () => {
            return config_1.default.isDev
                ? 'http://127.0.0.1:5501'
                : 'https://citizenship.benuestate.gov.ng';
        };
        const result = await this.authService.activate(params);
        const redirectUrl = result.success
            ? `${getFrontendBaseUrl()}/source/auth/activation-success.html`
            : `${getFrontendBaseUrl()}/source/auth/activation-failed.html`;
        return res.redirect(redirectUrl);
    }
    async resendActivationEmail(email, req) {
        return await this.authService.resendActivationEmail(email, (0, auth_1.getOriginHeader)(req));
    }
    signup(signUpDto, req) {
        return this.authService.signUpUser(signUpDto, (0, auth_1.getOriginHeader)(req), 'user');
    }
    async signupAgent(signUpDto, req) {
        return this.authService.signUpKindred(signUpDto, (0, auth_1.getOriginHeader)(req));
    }
    login(req, loginDto) {
        return this.authService.login(req?.user);
    }
    loginAgent(req, loginDto) {
        return this.authService.loginKindred(req?.user);
    }
    forgotPassword(body, req) {
        return this.authService.forgottenPassword(body, (0, auth_1.getOriginHeader)(req));
    }
    async resetPassword(resetPasswordDto, token) {
        return this.authService.resetPassword(resetPasswordDto, token);
    }
    async verifyNIN({ nin }) {
        const fakeDB = {
            '12345678901': {
                fullName: 'Godfrey Ejeh',
                dob: '1990-01-01',
                phone: '08079710658',
                stateOfOrigin: 'Benue',
                lga: 'Ogbadibo',
            },
            '98765432109': {
                fullName: 'John Doe',
                dob: '1990-01-01',
                phone: '08039710658',
                stateOfOrigin: 'Benue',
                lga: 'Buruku',
            },
            '98765432102': {
                fullName: 'Simon Iber',
                dob: '1990-01-01',
                phone: '08033710658',
                stateOfOrigin: 'Benue',
                lga: 'Buruku',
            },
            '98765432162': {
                fullName: 'Sheyi shay',
                dob: '1990-01-01',
                phone: '08133710658',
                stateOfOrigin: 'Ogun',
                lga: 'Ifo',
            },
            '88765432102': {
                fullName: 'Arome Mbur',
                dob: '1990-01-01',
                phone: '08030710658',
                stateOfOrigin: 'Kogi',
                lga: 'Okene',
            },
            '88765432105': {
                fullName: 'Derick Gbaden',
                dob: '1990-01-01',
                phone: '08043710650',
                stateOfOrigin: 'Benue',
                lga: 'Gboko',
            },
            '88765432101': {
                fullName: 'Charles Luper',
                dob: '1990-01-01',
                phone: '08043710658',
                stateOfOrigin: 'Benue',
                lga: 'Gboko',
            },
            '88765432131': {
                fullName: 'Victor Atir',
                dob: '1990-01-01',
                phone: '08043710666',
                stateOfOrigin: 'Benue',
                lga: 'Gboko',
            },
        };
        const data = fakeDB[nin];
        if (!data)
            throw new common_1.BadRequestException('NIN not found');
        return { success: true, data };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('activate/:userId/:activationToken'),
    __param(0, (0, common_1.Param)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_interface_1.ActivateParams, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "activate", null);
__decorate([
    (0, common_1.Post)('resend-activation'),
    __param(0, (0, common_1.Body)('email')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendActivationEmail", null);
__decorate([
    (0, common_1.Post)('signup'),
    (0, swagger_1.ApiResponse)({ type: auth_interface_1.AuthenticatedUser }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_interface_1.SignUpDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "signup", null);
__decorate([
    (0, common_1.Post)('signup-kindred'),
    (0, swagger_1.ApiResponse)({ type: auth_interface_1.AuthenticatedUser }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [kindredDto_1.SigUpKindredDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signupAgent", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('local')),
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiResponse)({ type: auth_interface_1.AuthenticatedUser }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_interface_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('local')),
    (0, common_1.Post)('login-kindred'),
    (0, swagger_1.ApiResponse)({ type: auth_interface_1.AuthenticatedUser }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, auth_interface_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "loginAgent", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_interface_1.ForgottenPasswordDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password/:token'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_interface_1.ResetPasswordDto, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('verify'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyNIN", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map