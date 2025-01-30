import { ConflictException, NotFoundException, ForbiddenException, UnauthorizedException, BadRequestException } from '@nestjs/common';
export declare const EmailAlreadyUsedException: () => ConflictException;
export declare const UserNotFoundException: () => NotFoundException;
export declare const ActivationTokenInvalidException: () => ForbiddenException;
export declare const PasswordResetTokenInvalidException: () => ForbiddenException;
export declare const LoginCredentialsException: () => UnauthorizedException;
export declare const ClientErrorException: () => BadRequestException;
