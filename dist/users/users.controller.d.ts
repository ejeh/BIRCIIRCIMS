import { UsersService } from './users.service';
import { User } from './users.schema';
import { UpdateProfileDto, UpdateUserRoleDto } from './users.dto';
export declare class UsersController {
    private readonly userService;
    constructor(userService: UsersService);
    updateUserProfile(id: string, body: UpdateProfileDto, file: Express.Multer.File): Promise<import("mongoose").Document<unknown, {}, import("./users.schema").UserDocument, {}> & User & import("mongoose").Document<unknown, any, any, Record<string, any>> & import("./users.schema").UserMethods & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    updateUserRole(id: string, body: UpdateUserRoleDto): Promise<import("mongoose").Document<unknown, {}, import("./users.schema").UserDocument, {}> & User & import("mongoose").Document<unknown, any, any, Record<string, any>> & import("./users.schema").UserMethods & Required<{
        _id: unknown;
    }> & {
        __v: number;
    }>;
    getProfile(id: string, body: any): Promise<any>;
    getPaginatedData(page?: number, limit?: number): Promise<{
        data: (import("mongoose").Document<unknown, {}, import("./users.schema").UserDocument, {}> & User & import("mongoose").Document<unknown, any, any, Record<string, any>> & import("./users.schema").UserMethods & Required<{
            _id: unknown;
        }> & {
            __v: number;
        })[];
        hasNextPage: boolean;
    }>;
}
