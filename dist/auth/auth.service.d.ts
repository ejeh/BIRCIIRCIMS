import { JwtService } from '@nestjs/jwt';
import { UserDocument } from 'src/users/users.schema';
import { UsersService } from 'src/users/users.service';
import { ActivateParams, ForgottenPasswordDto, ResetPasswordDto, SignUpDto } from './auth.interface';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<UserDocument>;
    activate({ userId, activationToken }: ActivateParams): Promise<{
        token: string;
        user: import("../users/users.dto").UserPublicData;
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
