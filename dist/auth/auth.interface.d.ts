import { UserPublicData } from 'src/users/users.dto';
export declare class SignUpDto {
    readonly firstname: string;
    readonly lastname: string;
    readonly phone: number;
    readonly NIN: number;
    readonly email: string;
    readonly password: string;
    readonly stateOfOrigin: string;
    readonly lgaOfOrigin: string;
}
export declare class ActivateParams {
    readonly userId: string;
    readonly activationToken: string;
}
export declare class AuthenticatedUser {
    token: string;
    user: UserPublicData;
}
export declare class LoginDto {
    readonly email: string;
    readonly password: string;
}
export declare class ForgottenPasswordDto {
    readonly email: string;
}
export declare class ResetPasswordDto {
    readonly email: string;
    readonly password: string;
}
