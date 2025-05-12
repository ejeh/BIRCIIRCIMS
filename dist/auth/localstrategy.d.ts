import { AuthService } from './auth.service';
import { UserDocument } from '../users/users.schema';
declare const LocalStrategy_base: new (...args: any[]) => any;
export declare class LocalStrategy extends LocalStrategy_base {
    private readonly authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<UserDocument>;
}
export {};
