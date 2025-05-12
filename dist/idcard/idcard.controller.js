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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdcardController = void 0;
const common_1 = require("@nestjs/common");
const idcard_service_1 = require("./idcard.service");
const users_service_1 = require("../users/users.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = __importStar(require("path"));
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const idcard_schema_1 = require("./idcard.schema");
const users_role_enum_1 = require("../users/users.role.enum");
const exception_1 = require("../common/exception");
const fs = __importStar(require("fs"));
const qrcode_1 = __importDefault(require("qrcode"));
const public_decorator_1 = require("../common/decorators/public.decorator");
let IdcardController = class IdcardController {
    constructor(idcardService, userService) {
        this.idcardService = idcardService;
        this.userService = userService;
    }
    async createIdCard(body, files) {
        const data = {
            ...body,
            bin: await this.idcardService.generateUniqueBIN(),
            ref_letter: files[0]?.filename,
            utilityBill: files[1]?.filename,
        };
        const adminEmail = 'ejehgodfrey@gmail.com';
        const adminPhone = '+1234567890';
        await this.userService.sendRequest(adminEmail, 'New Request', `Request for identity card 
          from ${body.lastname}
          `);
        return this.idcardService.createIdCard(data);
    }
    async getRequestsByStatuses(page = 1, limit = 10, statuses = 'Pending,Rejected') {
        const statusArray = statuses.split(',');
        return this.idcardService.findCardRequestsByStatuses(page, limit, statusArray);
    }
    async approveCert(id, Body) {
        return await this.idcardService.approveIdCard(id);
    }
    async rejectCert(id, rejectionReason) {
        const user = await this.idcardService.findCardById(id);
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        await this.userService.sendRequest(user.email, ' Request rejected', `Rejection Reason: ${rejectionReason}
           `);
        return await this.idcardService.rejectCard(id, rejectionReason);
    }
    async getUserProfile(id, body) {
        return await this.idcardService.findById(id);
    }
    async deleteItem(item) {
        return this.idcardService.deleteItem(item);
    }
    async downloadCertificate(id, res) {
        try {
            const card = await this.idcardService.findCertificateById(id);
            const user = await this.userService.findById(card.userId);
            if (!card) {
                return res.status(404).json({ message: 'Card not found' });
            }
            if (card.downloaded) {
                return res
                    .status(400)
                    .json({ message: 'Card has already been downloaded.' });
            }
            const date = new Date(user.DOB);
            const formattedDOB = date.toISOString().split('T')[0];
            const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | BIN: ${card.bin} | DOB: ${formattedDOB} | Sex: ${user.gender}`;
            const qrCodeUrl = await this.generateQrCode(qrCodeData);
            card.qrCodeUrl = qrCodeUrl;
            const htmlTemplate = await this.loadHtmlTemplate('card-template.html');
            const populatedHtml = this.populateHtmlTemplate(htmlTemplate, card, user);
            const pdfPath = await this.idcardService.generateIDCardPDF(id, populatedHtml);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
            res.download(pdfPath, 'certificate.pdf', async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    return;
                }
                await this.markCertificateAsDownloaded(id);
            });
        }
        catch (error) {
            console.error('Error processing request:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async loadHtmlTemplate(templateName) {
        const templatePath = path_1.default.join(__dirname, '..', '..', 'templates', templateName);
        return fs.promises.readFile(templatePath, 'utf8');
    }
    populateHtmlTemplate(html, data, user) {
        const dob = new Date(user.DOB);
        const formattedDOB = dob
            .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .replace(',', '');
        const dateOfIssue = new Date();
        const formattedDateOfIssue = dateOfIssue
            .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
            .replace(',', '');
        return html
            .replace(/{{name}}/g, user.firstname + ' ' + user.middlename)
            .replace(/{{surname}}/g, data.lastname)
            .replace(/{{dob}}/g, formattedDOB)
            .replace(/{{bin}}/g, data.bin)
            .replace(/{{passportPhoto}}/g, user.passportPhoto)
            .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl)
            .replace(/{{issueDate}}/g, formattedDateOfIssue)
            .replace(/{{gender}}/g, user.gender);
    }
    async markCertificateAsDownloaded(id) {
        try {
            await this.idcardService.markAsDownloaded(id);
        }
        catch (updateErr) {
            console.error('Error marking certificate as downloaded:', updateErr);
        }
    }
    async generateQrCode(data) {
        try {
            if (!data) {
                throw new Error('Input data is required');
            }
            const qrCodeUrl = await qrcode_1.default.toDataURL(data);
            return qrCodeUrl;
        }
        catch (error) {
            console.error('Error generating QR code:', error);
            throw new Error('Failed to generate QR code');
        }
    }
    async getProfile(id, body) {
        return await this.idcardService.findOne(id);
    }
    resubmitRequest(id, updatedData) {
        return this.idcardService.resubmitRequest(id, updatedData);
    }
    async getCert(id, body) {
        return await this.idcardService.findById(id);
    }
    getPdf(filename, res, req) {
        const filePath = (0, path_1.join)('/home/spaceinovationhub/BSCR-MIS-BkND/uploads', filename);
        if (!fs.existsSync(filePath)) {
            throw new common_1.NotFoundException('File not found');
        }
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
        stream.on('error', (err) => {
            console.error('Stream error:', err);
            res.status(500).end('Failed to serve PDF');
        });
    }
};
exports.IdcardController = IdcardController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 2, {
        dest: './uploads',
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, cb) => {
                const randomName = Date.now() + '-' + Math.round(Math.random() * 1e9);
                cb(null, `${randomName}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "createIdCard", null);
__decorate([
    (0, common_1.Get)('request'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPPORT_ADMIN, users_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('statuses')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "getRequestsByStatuses", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "approveCert", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('rejectionReason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "rejectCert", null);
__decorate([
    (0, common_1.Get)(':id/request'),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Delete)(':item'),
    __param(0, (0, common_1.Param)('item')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "deleteItem", null);
__decorate([
    (0, common_1.Get)('download/:id'),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "downloadCertificate", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)(':id/resubmit'),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IdcardController.prototype, "resubmitRequest", null);
__decorate([
    (0, common_1.Get)(':id/get'),
    (0, swagger_1.ApiResponse)({ type: idcard_schema_1.IdCard, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IdcardController.prototype, "getCert", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('pdf/:filename'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], IdcardController.prototype, "getPdf", null);
exports.IdcardController = IdcardController = __decorate([
    (0, swagger_1.ApiTags)('idCard.controller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/idcard'),
    __metadata("design:paramtypes", [idcard_service_1.IdcardService,
        users_service_1.UsersService])
], IdcardController);
//# sourceMappingURL=idcard.controller.js.map