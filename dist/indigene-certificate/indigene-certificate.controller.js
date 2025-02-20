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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndigeneCertificateController = void 0;
const common_1 = require("@nestjs/common");
const exception_1 = require("../common/exception");
const swagger_1 = require("@nestjs/swagger");
const indigene_certificate_service_1 = require("./indigene-certificate.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const users_role_enum_1 = require("../users/users.role.enum");
const indigene_certicate_schema_1 = require("./indigene-certicate.schema");
const users_service_1 = require("../users/users.service");
const uuid_1 = require("uuid");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
let IndigeneCertificateController = class IndigeneCertificateController {
    constructor(indigeneCertificateService, userService) {
        this.indigeneCertificateService = indigeneCertificateService;
        this.userService = userService;
    }
    async createCertificate(body, files) {
        const data = {
            ...body,
            refNumber: (0, uuid_1.v4)(),
            passportPhoto: files[0]?.path,
            idCard: files[1]?.path,
            birthCertificate: files[2]?.path,
            parentGuardianIndigeneCert: files[3]?.path,
        };
        const adminEmail = 'ejehgodfrey@gmail.com';
        const adminPhone = '+1234567890';
        await this.userService.sendRequest(adminEmail, 'New Request', `Request for certificate of origin 
      from ${body.email}
      `);
        return this.indigeneCertificateService.createCertificate(data);
    }
    async downloadTemplate(id, res) {
        return this.indigeneCertificateService.getAttestationTemplate(id, res);
    }
    async uploadAttestation(id, file) {
        return this.indigeneCertificateService.uploadAttestation(id, file);
    }
    async downloadCertificate(id, res) {
        try {
            const certificate = await this.indigeneCertificateService.findCertificateById(id);
            const user = await this.userService.findById(certificate.userId);
            if (!certificate) {
                return res.status(404).json({ message: 'Certificate not found' });
            }
            if (certificate.downloaded) {
                return res
                    .status(400)
                    .json({ message: 'Certificate has already been downloaded.' });
            }
            const dateOfIssue = new Date();
            const formattedDate = dateOfIssue.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
            const qrCodeData = `Name: ${user.firstname} ${user.middlename} ${user.lastname} | issueDate: ${formattedDate} | Sex: ${user.gender} | issuer: Benue Digital Infrastructure Company`;
            const qrCodeUrl = await this.generateQrCode(qrCodeData);
            certificate.qrCodeUrl = qrCodeUrl;
            const htmlTemplate = await this.loadHtmlTemplate('certificate-template.html');
            const populatedHtml = this.populateHtmlTemplate(htmlTemplate, certificate, user);
            const pdfPath = await this.indigeneCertificateService.generateCertificatePDF(id, populatedHtml);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=certificate.pdf');
            res.download(pdfPath, 'certificate.pdf', async (err) => {
                if (err) {
                    console.error('Error sending file:', err);
                    return res.status(500).json({ message: 'Error downloading file' });
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
        const templatePath = path.join(__dirname, '..', '..', 'templates', templateName);
        return fs.promises.readFile(templatePath, 'utf8');
    }
    populateHtmlTemplate(html, data, user) {
        const date = new Date(data.DOB);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const dateOfIssue = new Date();
        const formattedDateOfIssue = dateOfIssue.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        return html
            .replace(/{{name}}/g, user.firstname + ' ' + user.middlename + ' ' + user.lastname)
            .replace(/{{lga}}/g, data.lgaOfOrigin)
            .replace(/{{family}}/g, data.fathersName)
            .replace(/{{ward}}/g, data.ward)
            .replace(/{{kindred}}/g, data.kindred)
            .replace(/{{dob}}/g, formattedDate)
            .replace(/{{issueDate}}/g, formattedDateOfIssue)
            .replace(/{{passportPhoto}}/g, user.passportPhoto)
            .replace(/{{qrCodeUrl}}/g, data.qrCodeUrl);
    }
    async markCertificateAsDownloaded(id) {
        try {
            await this.indigeneCertificateService.markAsDownloaded(id);
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
    async getCertsRequest(req) {
        return await this.indigeneCertificateService.certificateModel.find({});
    }
    async approveCert(id, Body) {
        return await this.indigeneCertificateService.approveCertificate(id);
    }
    async rejectCert(id, rejectionReason) {
        console.log(rejectionReason);
        const user = await this.indigeneCertificateService.findCertificateById(id);
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        await this.userService.sendRequest(user.email, ' Request rejected', `Rejection Reason: ${rejectionReason}
       `);
        return await this.indigeneCertificateService.rejectCertificate(id, rejectionReason);
    }
    resubmitRequest(id, updatedData) {
        return this.indigeneCertificateService.resubmitRequest(id, updatedData);
    }
    async getPaginatedData(page = 1, limit = 10) {
        return this.indigeneCertificateService.getPaginatedData(page, limit);
    }
    async getApprovedCert(page = 1, limit = 10) {
        return this.indigeneCertificateService.findApprovedRequest(page, limit, 'Approved');
    }
    async getRequestsByStatuses(page = 1, limit = 10, statuses = 'Pending,Rejected') {
        const statusArray = statuses.split(',');
        return this.indigeneCertificateService.findRequestsByStatuses(page, limit, statusArray);
    }
    async getCert(id, body) {
        return await this.indigeneCertificateService.findById(id);
    }
    async getProfile(id, body) {
        return await this.indigeneCertificateService.findOne(id);
    }
    async getUserProfile(id, body) {
        return await this.indigeneCertificateService.findById(id);
    }
    async deleteItem(item) {
        return this.indigeneCertificateService.deleteItem(item);
    }
};
exports.IndigeneCertificateController = IndigeneCertificateController;
__decorate([
    (0, common_1.Post)('create'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 4, {
        dest: './uploads',
        limits: { fileSize: 1024 * 1024 * 5 },
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
], IndigeneCertificateController.prototype, "createCertificate", null);
__decorate([
    (0, common_1.Get)('download/attestation/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "downloadTemplate", null);
__decorate([
    (0, common_1.Post)('upload/attestation/:id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.diskStorage)({
            destination: './uploads',
            filename: (req, file, callback) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                callback(null, `${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
            },
        }),
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "uploadAttestation", null);
__decorate([
    (0, common_1.Get)('download/:id'),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "downloadCertificate", null);
__decorate([
    (0, common_1.Get)('get-all-request'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Request]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getCertsRequest", null);
__decorate([
    (0, common_1.Patch)(':id/approve'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "approveCert", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('rejectionReason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "rejectCert", null);
__decorate([
    (0, common_1.Post)(':id/resubmit'),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], IndigeneCertificateController.prototype, "resubmitRequest", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getPaginatedData", null);
__decorate([
    (0, common_1.Get)('approval'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPPORT_ADMIN, users_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getApprovedCert", null);
__decorate([
    (0, common_1.Get)('request'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: true }),
    (0, roles_decorator_1.Roles)(users_role_enum_1.UserRole.SUPPORT_ADMIN, users_role_enum_1.UserRole.SUPER_ADMIN),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('statuses')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getRequestsByStatuses", null);
__decorate([
    (0, common_1.Get)(':id/get'),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getCert", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Get)(':id/request'),
    (0, swagger_1.ApiResponse)({ type: indigene_certicate_schema_1.Certificate, isArray: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Delete)(':item'),
    __param(0, (0, common_1.Param)('item')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], IndigeneCertificateController.prototype, "deleteItem", null);
exports.IndigeneCertificateController = IndigeneCertificateController = __decorate([
    (0, swagger_1.ApiTags)('indigene-certificate.controller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/indigene/certificate'),
    __metadata("design:paramtypes", [indigene_certificate_service_1.IndigeneCertificateService,
        users_service_1.UsersService])
], IndigeneCertificateController);
//# sourceMappingURL=indigene-certificate.controller.js.map