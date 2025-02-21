"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("./users.service");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const users_schema_1 = require("./users.schema");
const users_dto_1 = require("./users.dto");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_role_enum_1 = require("./users.role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const parse_json_pipe_1 = require("./parse-json.pipe");
let UsersController = class UsersController {
    constructor(userService) {
        this.userService = userService;
    }
    async getSystemUsers(req) {
        return await this.userService.userModel.find({});
    }
    async updateUserProfile(id, body, file) {
        if (typeof body.educationalHistory === 'string') {
            try {
                const parsedEducationalHistory = JSON.parse(body.educationalHistory);
                body = { ...body, educationalHistory: parsedEducationalHistory };
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid educationalHistory format.');
            }
        }
        if (typeof body.employmentHistory === 'string') {
            try {
                const parsedEmploymentHistory = JSON.parse(body.employmentHistory);
                body = { ...body, employmentHistory: parsedEmploymentHistory };
            }
            catch (error) {
                throw new common_1.BadRequestException('Invalid employmentHistory format.');
            }
        }
        try {
            const updatedData = { ...body };
            if (file) {
                updatedData.passportPhoto = `https://identity-management-af43.onrender.com/uploads/${file.filename}`;
            }
            const user = await this.userService.userModel.findByIdAndUpdate(id, updatedData, { new: true });
            if (!user) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            return user;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'An error occurred while updating the profile', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async updateUserRole(id, body) {
        return await this.userService.userModel.findByIdAndUpdate(id, { ...body }, { new: true });
    }
    async getProfile(id, body) {
        const user = await this.userService.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            ...user.toObject(),
            DOB: user.DOB ? user.DOB.toISOString().split('T')[0] : '',
        };
    }
    async getPaginatedData(page = 1, limit = 10) {
        return this.userService.getPaginatedData(page, limit);
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('get-system-users'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: users_schema_1.User, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN, users_role_enum_1.UserRole.SUPPORT_ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSystemUsers", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiResponse)({ type: users_schema_1.User, isArray: false }),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('passportPhoto', {
        dest: './uploads',
        limits: { fileSize: 1024 * 1024 * 5 },
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const fileExt = (0, path_1.extname)(file.originalname);
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
        fileFilter: (req, file, cb) => {
            const allowedMimeTypes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/jpg',
            ];
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.HttpException('Invalid file type', common_1.HttpStatus.BAD_REQUEST), false);
            }
        },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)(new parse_json_pipe_1.ParseJSONPipe())),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UpdateProfileDto, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserProfile", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiResponse)({ type: users_schema_1.User, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.UpdateUserRoleDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiResponse)({ type: users_schema_1.User, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: users_schema_1.User, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getPaginatedData", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users-controller'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('api/users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map