import { UserDocument } from './users.schema';
import { Model } from 'mongoose';
import { UserMailerService } from './users.mailer.service';
export declare class UsersService {
    readonly userModel: Model<UserDocument>;
    private readonly userMailer;
    constructor(userModel: Model<UserDocument>, userMailer: UserMailerService);
    create(firstname: string, lastname: string, email: string, password: string, phone: number, NIN: number, role: string, origin: string): Promise<UserDocument>;
    findById(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument>;
    activate(userId: string, activationToken: string): Promise<import("mongoose").Document<unknown, {}, UserDocument> & import("./users.schema").User & import("mongoose").Document<unknown, any, any> & import("./users.schema").UserMethods & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    resendActivationEmail(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    forgottenPassword(email: string, origin: string): Promise<void>;
    resetPassword(email: string, passwordResetToken: string, password: string): Promise<import("mongoose").Document<unknown, {}, UserDocument> & import("./users.schema").User & import("mongoose").Document<unknown, any, any> & import("./users.schema").UserMethods & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getPaginatedData(page: number, limit: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, UserDocument> & import("./users.schema").User & import("mongoose").Document<unknown, any, any> & import("./users.schema").UserMethods & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
    sendRequest(email: string, subject: string, body: string): Promise<UserDocument>;
}
