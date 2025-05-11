"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneAlreadyUsedException = exports.ClientErrorException = exports.LoginCredentialsException = exports.PasswordResetTokenInvalidException = exports.ActivationTokenInvalidException = exports.UserNotFoundException = exports.EmailAlreadyUsedException = void 0;
const common_1 = require("@nestjs/common");
const EmailAlreadyUsedException = () => new common_1.ConflictException('Email, Phone or NIN number is already in use.');
exports.EmailAlreadyUsedException = EmailAlreadyUsedException;
const UserNotFoundException = () => new common_1.NotFoundException('Requested user does not exist.');
exports.UserNotFoundException = UserNotFoundException;
const ActivationTokenInvalidException = () => new common_1.ForbiddenException('Activation token is invalid or has expired.');
exports.ActivationTokenInvalidException = ActivationTokenInvalidException;
const PasswordResetTokenInvalidException = () => new common_1.ForbiddenException('Password reset token is invalid or has expired.');
exports.PasswordResetTokenInvalidException = PasswordResetTokenInvalidException;
const LoginCredentialsException = () => new common_1.UnauthorizedException('Login credentials are wrong.');
exports.LoginCredentialsException = LoginCredentialsException;
const ClientErrorException = () => new common_1.BadRequestException('Client Error.');
exports.ClientErrorException = ClientErrorException;
const PhoneAlreadyUsedException = () => new common_1.ConflictException('Phone number already in use');
exports.PhoneAlreadyUsedException = PhoneAlreadyUsedException;
//# sourceMappingURL=exception.js.map