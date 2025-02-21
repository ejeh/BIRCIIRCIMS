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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const auth_interface_1 = require("./auth.interface");
const auth_1 = require("./auth");
const passport_1 = require("@nestjs/passport");
let AuthController = class AuthController {
    constructor(authService, userService) {
        this.authService = authService;
        this.userService = userService;
    }
    async activate(params, res) {
        const result = await this.authService.activate(params);
        if (result.success) {
            return res.redirect('http://127.0.0.1:5501/auth/activation-success.html');
        }
        else {
            return res.redirect(`http://127.0.0.1:5501/auth/activation-failed.html`);
        }
    }
    async resendActivationEmail(email, req) {
        return await this.authService.resendActivationEmail(email, (0, auth_1.getOriginHeader)(req));
    }
    signup(signUpDto, req) {
        return this.authService.signUpUser(signUpDto, (0, auth_1.getOriginHeader)(req), 'user');
    }
    login(req, loginDto) {
        return this.authService.login(req?.user);
    }
    forgotPassword(body, req) {
        return this.authService.forgottenPassword(body, (0, auth_1.getOriginHeader)(req));
    }
    resetPassword(body) {
        return this.authService.resetPassword(body);
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
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_interface_1.ForgottenPasswordDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [auth_interface_1.ResetPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "resetPassword", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('auth'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        users_service_1.UsersService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map