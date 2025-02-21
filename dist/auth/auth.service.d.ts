import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { ActivateParams, ForgottenPasswordDto, ResetPasswordDto, SignUpDto } from './auth.interface';
import { Model } from 'mongoose';
import { UserMailerService } from 'src/users/users.mailer.service';
export declare class AuthService {
    readonly userModel: Model<User>;
    private readonly userMailer;
    private readonly usersService;
    private readonly jwtService;
    constructor(userModel: Model<User>, userMailer: UserMailerService, usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<UserDocument>;
    activate({ userId, activationToken }: ActivateParams): Promise<{
        success: boolean;
        message: string;
        token?: undefined;
        user?: undefined;
    } | {
        success: boolean;
        message: string;
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
    resendActivationEmail(email: string, origin: string): Promise<{
        success: boolean;
        message: string;
    }>;
    signUpUser(userData: SignUpDto, origin: string, role: string): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
    login(user?: any): Promise<{
        token: string;
        user: any;
    }>;
    forgottenPassword({ email }: ForgottenPasswordDto, origin: string): Promise<void>;
    resetPassword({ email, passwordResetToken, password, }: ResetPasswordDto): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
    }>;
}
