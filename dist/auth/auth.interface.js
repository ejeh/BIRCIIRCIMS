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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResetPasswordDto = exports.ForgottenPasswordDto = exports.LoginDto = exports.AuthenticatedUser = exports.ActivateParams = exports.SignUpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SignUpDto {
}
exports.SignUpDto = SignUpDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SignUpDto.prototype, "firstname", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SignUpDto.prototype, "lastname", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(11),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], SignUpDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(11),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], SignUpDto.prototype, "NIN", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'email@gmail.com',
        maxLength: 255,
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], SignUpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password', minLength: 8 }),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], SignUpDto.prototype, "password", void 0);
class ActivateParams {
}
exports.ActivateParams = ActivateParams;
__decorate([
    (0, swagger_1.ApiProperty)({ type: String }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivateParams.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ActivateParams.prototype, "activationToken", void 0);
class AuthenticatedUser {
}
exports.AuthenticatedUser = AuthenticatedUser;
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], AuthenticatedUser.prototype, "token", void 0);
class LoginDto {
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'email@email.com', maxLength: 255 }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password', minLength: 8 }),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
class ForgottenPasswordDto {
}
exports.ForgottenPasswordDto = ForgottenPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'email@email.com', maxLength: 255 }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], ForgottenPasswordDto.prototype, "email", void 0);
class ResetPasswordDto {
}
exports.ResetPasswordDto = ResetPasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'email@email.com', maxLength: 255 }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: String }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "passwordResetToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password', minLength: 8 }),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);
//# sourceMappingURL=auth.interface.js.map