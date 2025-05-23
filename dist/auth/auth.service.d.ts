import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { ActivateParams, ForgottenPasswordDto, ResetPasswordDto, SignUpDto } from './auth.interface';
import { Model } from 'mongoose';
import { UserMailerService } from 'src/users/users.mailer.service';
import { SigUpKindredDto } from 'src/kindred/kindredDto';
import { KindredService } from 'src/kindred/kindred.service';
import { UserPublicData } from 'src/users/users.dto';
export declare class AuthService {
    readonly userModel: Model<User>;
    private readonly userMailer;
    private readonly usersService;
    private readonly jwtService;
    private readonly kindredService;
    constructor(userModel: Model<User>, userMailer: UserMailerService, usersService: UsersService, jwtService: JwtService, kindredService: KindredService);
    private fakeDatabase;
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
        user: UserPublicData;
    }>;
    resendActivationEmail(email: string, origin: string): Promise<{
        success: boolean;
        message: string;
    }>;
    signUpUser(userData: SignUpDto, origin: string, role: string): Promise<{
        token: string;
        user: UserPublicData;
        success: boolean;
        message: string;
    }>;
    signUpKindred(userData: SigUpKindredDto, origin: string): Promise<{
        token: string;
        user: UserPublicData;
    }>;
    login(user?: any): Promise<{
        token: string;
        user: any;
    }>;
    loginKindred(user?: User): Promise<{
        token: string;
        user: any;
    }>;
    forgottenPassword({ email }: ForgottenPasswordDto, origin: string): Promise<void>;
    resetPassword(resetPasswordDto: ResetPasswordDto, token: string): Promise<{
        token: string;
        user: UserPublicData;
    }>;
}
