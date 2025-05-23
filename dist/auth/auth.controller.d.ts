import { AuthService } from './auth.service';
import { ActivateParams, ForgottenPasswordDto, LoginDto, ResetPasswordDto, SignUpDto } from './auth.interface';
import { Request, Response } from 'express';
import { AppRequest } from 'src/generic/generic.interface';
import { SigUpKindredDto } from 'src/kindred/kindredDto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    activate(params: ActivateParams, res: Response): Promise<void>;
    resendActivationEmail(email: string, req: Request): Promise<{
        success: boolean;
        message: string;
    }>;
    signup(signUpDto: SignUpDto, req: Request): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
        success: boolean;
        message: string;
    }>;
    signupAgent(signUpDto: SigUpKindredDto, req: Request): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
    login(req: AppRequest, loginDto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    loginAgent(req: AppRequest, loginDto: LoginDto): Promise<{
        token: string;
        user: any;
    }>;
    forgotPassword(body: ForgottenPasswordDto, req: Request): Promise<void>;
    resetPassword(resetPasswordDto: ResetPasswordDto, token: string): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
    verifyNIN({ nin }: {
        nin: string;
    }): Promise<{
        success: boolean;
        data: any;
    }>;
}
