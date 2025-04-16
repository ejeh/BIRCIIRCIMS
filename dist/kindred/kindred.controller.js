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
exports.KindredController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const kindred_service_1 = require("./kindred.service");
const kindredDto_1 = require("./kindredDto");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_role_enum_1 = require("../users/users.role.enum");
const swagger_1 = require("@nestjs/swagger");
let KindredController = class KindredController {
    constructor(kindredService) {
        this.kindredService = kindredService;
    }
    async getPaginatedData(page = 1, limit = 10) {
        return this.kindredService.getPaginatedData(page, limit);
    }
    async getkindredHeads(userId, page = 1, limit = 10) {
        return this.kindredService.getkindredHeads(userId, page, limit);
    }
    async updateKindred(id, body) {
        return this.kindredService.updateKindred(id, body);
    }
    async deleteItem(item) {
        return this.kindredService.deleteItem(item);
    }
};
exports.KindredController = KindredController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiResponse)({ type: 'Kindred', isArray: true }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], KindredController.prototype, "getPaginatedData", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPPORT_ADMIN),
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], KindredController.prototype, "getkindredHeads", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPPORT_ADMIN),
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, kindredDto_1.UpdateKindredDto]),
    __metadata("design:returntype", Promise)
], KindredController.prototype, "updateKindred", null);
__decorate([
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPPORT_ADMIN),
    (0, common_1.Delete)(':item'),
    __param(0, (0, common_1.Param)('item')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], KindredController.prototype, "deleteItem", null);
exports.KindredController = KindredController = __decorate([
    (0, common_1.Controller)('api/kindred'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [kindred_service_1.KindredService])
], KindredController);
//# sourceMappingURL=kindred.controller.js.map