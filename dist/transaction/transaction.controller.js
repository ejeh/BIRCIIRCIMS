"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionController = void 0;
const common_1 = require("@nestjs/common");
const transaction_service_1 = require("./transaction.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const users_role_enum_1 = require("../users/users.role.enum");
const roles_guard_1 = require("../common/guards/roles.guard");
const crypto = __importStar(require("crypto"));
let TransactionController = class TransactionController {
    constructor(transactionService) {
        this.transactionService = transactionService;
    }
    async initializePayment(data) {
        return this.transactionService.initializePayment(data);
    }
    async handleCredoWebhook(req, res) {
        try {
            const rawBody = req.rawBody;
            if (!rawBody) {
                console.error('Raw body is missing');
                return res.status(400).send('Raw body is missing');
            }
            const sha256Signature = req.headers['credo-signature'];
            const sha512Signature = req.headers['x-credo-signature'];
            if (!sha256Signature && !sha512Signature) {
                return res.status(400).send('Missing Credo signature header');
            }
            const payload = JSON.parse(rawBody.toString('utf8'));
            const secret = '1234567890';
            const businessCode = payload.data.businessCode;
            const signedContent = `${secret}${businessCode}`;
            const sha256Hash = crypto
                .createHash('sha256')
                .update(signedContent)
                .digest('hex');
            const sha512Hash = crypto
                .createHash('sha512')
                .update(signedContent)
                .digest('hex');
            console.log('SHA-512 Generated Hash:', sha512Hash);
            console.log('SHA-512 Received Signature:', sha512Signature);
            const isValidSignature = sha256Signature === sha256Hash || sha512Signature === sha512Hash;
            if (!isValidSignature) {
                console.error('Invalid signature');
                return res.status(401).send('Invalid signature');
            }
            await this.transactionService.handleCredoWebhook(payload);
            return res.send('Webhook processed');
        }
        catch (error) {
            console.error('Webhook processing failed:', error);
            return res.status(500).send('Internal Server Error');
        }
    }
    async getApprovedItems() {
        return this.transactionService.getApprovedItems();
    }
    async verifyPayment(reference) {
        return this.transactionService.verifyPayment(reference);
    }
    async getUserTransactions(userId) {
        return this.transactionService.getUserTransactions(userId);
    }
    async getPaginatedData(page = 1, limit = 10) {
        return this.transactionService.getPaginatedData(page, limit);
    }
};
exports.TransactionController = TransactionController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)('pay'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "initializePayment", null);
__decorate([
    (0, common_1.Post)('webhook'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request, Object]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "handleCredoWebhook", null);
__decorate([
    (0, common_1.Get)('approved-items'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "getApprovedItems", null);
__decorate([
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Get)('verify/:reference'),
    __param(0, (0, common_1.Param)('reference')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)(':userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "getUserTransactions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TransactionController.prototype, "getPaginatedData", null);
exports.TransactionController = TransactionController = __decorate([
    (0, common_1.Controller)('api/transaction'),
    __metadata("design:paramtypes", [transaction_service_1.TransactionService])
], TransactionController);
//# sourceMappingURL=transaction.controller.js.map