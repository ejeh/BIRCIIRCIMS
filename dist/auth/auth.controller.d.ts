import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { ActivateParams, ForgottenPasswordDto, LoginDto, ResetPasswordDto, SignUpDto } from './auth.interface';
import { Request, Response } from 'express';
import { AppRequest } from 'src/generic/generic.interface';
export declare class AuthController {
    private readonly authService;
    private readonly userService;
    constructor(authService: AuthService, userService: UsersService);
    activate(params: ActivateParams, res: Response): Promise<void>;
    resendActivationEmail(email: string, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    signup(signUpDto: SignUpDto, req: Request): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
    login(req: AppRequest, loginDto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    forgotPassword(body: ForgottenPasswordDto, req: Request): Promise<void>;
    resetPassword(body: ResetPasswordDto): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
}
