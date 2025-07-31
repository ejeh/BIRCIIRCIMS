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
const parse_json_pipe_1 = require("./parse-json.pipe");
const public_decorator_1 = require("../common/decorators/public.decorator");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let UsersController = class UsersController {
    constructor(userService, cloudinaryService) {
        this.userService = userService;
        this.cloudinaryService = cloudinaryService;
    }
    async updateUserProfile(id, body, file) {
        function isEducationalHistoryComplete(edu) {
            if (!edu)
                return false;
            const checkSchool = (school) => school &&
                school.name?.trim() &&
                school.address?.trim() &&
                school.yearOfAttendance?.trim();
            const primary = checkSchool(edu.primarySchool);
            const secondary = checkSchool(edu.secondarySchool);
            const tertiaryComplete = Array.isArray(edu.tertiaryInstitutions) &&
                edu.tertiaryInstitutions.length > 0;
            return primary && secondary && tertiaryComplete;
        }
        function isEmploymentHistoryComplete(history) {
            if (!Array.isArray(history) || history.length === 0)
                return false;
            return history.every((job) => job.companyName?.trim() &&
                job.address?.trim() &&
                job.designation?.trim() &&
                job.startYear !== null &&
                job.startYear !== undefined &&
                job.endYear !== null &&
                job.endYear !== undefined);
        }
        function isFamilyComplete(family) {
            if (!Array.isArray(family))
                return false;
            const verifiedFamily = family.filter((f) => f.name?.trim() &&
                f.relationship?.trim() &&
                f.phone?.trim() &&
                f.address?.trim() &&
                f.status === 'verified');
            return verifiedFamily.length >= 3;
        }
        function isNeighborComplete(neighbors) {
            if (!Array.isArray(neighbors))
                return false;
            const verifiedNeighbors = neighbors.filter((n) => n.name?.trim() &&
                n.address?.trim() &&
                n.phone?.trim() &&
                n.status === 'verified');
            return verifiedNeighbors.length >= 3;
        }
        function calculateProfileCompletion(user) {
            let score = 0;
            let totalWeight = 0;
            const essentialFields = [
                user.firstname,
                user.lastname,
                user.phone,
                user.NIN,
                user.DOB,
                user.gender,
                user.passportPhoto,
                user.stateOfOrigin,
                user.lgaOfOrigin,
                user.nationality,
            ];
            const essentialFilled = essentialFields.filter((val) => val !== undefined && val !== null && String(val).trim() !== '').length;
            score += (essentialFilled / essentialFields.length) * 60;
            totalWeight += 60;
            const backgroundChecks = [
                isEducationalHistoryComplete(user.educationalHistory) ? 1 : 0,
                isEmploymentHistoryComplete(user.employmentHistory) ? 1 : 0,
                isFamilyComplete(user.family) ? 1 : 0,
                isNeighborComplete(user.neighbor) ? 1 : 0,
            ];
            const backgroundScore = (backgroundChecks.reduce((a, b) => a + b, 0) /
                backgroundChecks.length) *
                30;
            score += backgroundScore;
            totalWeight += 30;
            const optionalFields = [
                user.religion,
                user.community,
                user.business?.length ? 'filled' : '',
                user.healthInfo?.length ? 'filled' : '',
            ];
            const optionalFilled = optionalFields.filter((val) => val !== undefined && val !== null && String(val).trim() !== '').length;
            score += (optionalFilled / optionalFields.length) * 10;
            totalWeight += 10;
            return Math.round(score);
        }
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
            const currentUser = await this.userService.userModel.findById(id);
            if (!currentUser) {
                throw new common_1.HttpException('User not found', common_1.HttpStatus.NOT_FOUND);
            }
            if (updatedData.neighbor && Array.isArray(updatedData.neighbor)) {
                updatedData.neighbor = updatedData.neighbor.map((newNeighbor) => {
                    const existingNeighbor = currentUser.neighbor.find((n) => n.phone === newNeighbor.phone);
                    return existingNeighbor
                        ? {
                            ...newNeighbor,
                            verificationLink: existingNeighbor.verificationLink,
                            verificationToken: existingNeighbor.verificationToken,
                            status: existingNeighbor.status,
                            isFollowUpSent: existingNeighbor.isFollowUpSent,
                            verificationExpiresAt: existingNeighbor.verificationExpiresAt,
                            isResident: existingNeighbor.isResident,
                            knownDuration: existingNeighbor.knownDuration,
                            knowsApplicant: existingNeighbor.knowsApplicant,
                            verifiedAt: existingNeighbor.verifiedAt,
                        }
                        : newNeighbor;
                });
            }
            if (updatedData.family && Array.isArray(updatedData.family)) {
                updatedData.family = updatedData.family.map((newFamily) => {
                    const existingFamily = currentUser.family.find((f) => f.phone === newFamily.phone);
                    return existingFamily
                        ? {
                            ...newFamily,
                            verificationLink: existingFamily.verificationLink,
                            verificationToken: existingFamily.verificationToken,
                            status: existingFamily.status,
                            isFollowUpSent: existingFamily.isFollowUpSent,
                            verificationExpiresAt: existingFamily.verificationExpiresAt,
                            isResident: existingFamily.isResident,
                            knownDuration: existingFamily.knownDuration,
                            knowsApplicant: existingFamily.knowsApplicant,
                            verifiedAt: existingFamily.verifiedAt,
                        }
                        : newFamily;
                });
            }
            const userDoc = await this.userService.findById(id);
            const oldPassportUrl = userDoc.passportPhoto;
            if (file) {
                if (oldPassportUrl) {
                    const publicId = this.cloudinaryService.getFullPublicIdFromUrl(oldPassportUrl);
                    if (publicId) {
                        try {
                            await this.cloudinaryService.deleteFile(publicId);
                        }
                        catch (err) {
                            console.warn(`Failed to delete old passport: ${err.message}`);
                        }
                    }
                }
                try {
                    const passportUrl = await this.cloudinaryService.uploadFile(file, 'users/passports', ['image/jpeg', 'image/png', 'image/jpg'], 5);
                    updatedData.passportPhoto = passportUrl;
                }
                catch (error) {
                    throw new common_1.HttpException(`Passport upload failed: ${error.message}`, common_1.HttpStatus.BAD_REQUEST);
                }
            }
            const merged = { ...currentUser.toObject(), ...updatedData };
            const completion = calculateProfileCompletion(merged);
            updatedData.isProfileCompleted = completion >= 90;
            updatedData.profileCompletionPercentage = completion;
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
    async getVerificationTokens(id) {
        const user = await this.userService.userModel.findById(id);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return {
            neighbor: user.neighbor?.map((n) => ({
                id: n._id,
                verificationToken: n.verificationToken,
                verificationLink: n.verificationLink,
                status: n.status,
            })),
            family: user.family?.map((f) => ({
                id: f._id,
                verificationToken: f.verificationToken,
                verificationLink: f.verificationLink,
                status: f.status,
            })),
        };
    }
    async getVerificationDetails(token) {
        return this.userService.getVerificationDetails(token);
    }
    async verifyReference(token, verificationData) {
        return this.userService.verifyReference(token, verificationData);
    }
    async initiateVerification(id) {
        return this.userService.initiateVerification(id);
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
    (0, common_1.Put)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('passportPhoto', {
        limits: { fileSize: 1024 * 1024 * 5 },
        fileFilter: (req, file, cb) => {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
            if (allowedTypes.includes(file.mimetype)) {
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
    (0, common_1.Get)(':id/verification-tokens'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getVerificationTokens", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('verify-reference/:token'),
    (0, swagger_1.ApiResponse)({ type: Object, isArray: false }),
    __param(0, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getVerificationDetails", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('verify-reference/:token'),
    (0, swagger_1.ApiResponse)({ type: Object, isArray: false }),
    __param(0, (0, common_1.Param)('token')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, users_dto_1.VerifyReferenceDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "verifyReference", null);
__decorate([
    (0, common_1.Post)(':id/initiate-verification'),
    (0, swagger_1.ApiResponse)({ type: Object, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "initiateVerification", null);
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
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN, users_role_enum_1.UserRole.SUPPORT_ADMIN, users_role_enum_1.UserRole.KINDRED_HEAD),
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
    __metadata("design:paramtypes", [users_service_1.UsersService,
        cloudinary_service_1.CloudinaryService])
], UsersController);
//# sourceMappingURL=users.controller.js.map