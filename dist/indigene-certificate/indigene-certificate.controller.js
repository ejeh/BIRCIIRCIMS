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
exports.IndigeneCertificateController = void 0;
const common_1 = require("@nestjs/common");
const exception_1 = require("../common/exception");
const swagger_1 = require("@nestjs/swagger");
const indigene_certificate_service_1 = require("./indigene-certificate.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const path_1 = require("path");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const roles_guard_1 = require("../common/guards/roles.guard");
const users_role_enum_1 = require("../users/users.role.enum");
const indigene_certicate_schema_1 = require("./indigene-certicate.schema");
const users_service_1 = require("../users/users.service");
const uuid_1 = require("uuid");
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
            if (!certificate) {
                return res.status(404).json({ message: 'Certificate not found' });
            }
            if (certificate.downloaded) {
                throw new Error('Certificate has already been downloaded.');
            }
            const pdfPath = await this.generateCertificatePDF(id, certificate);
            res.download(pdfPath, 'certificate.pdf', async (err) => {
                fs.unlink(pdfPath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting temporary file:', unlinkErr);
                    }
                });
                if (err) {
                    console.error('Error sending file:', err);
                    return res.status(500).json({ message: 'Error downloading file' });
                }
                try {
                    await this.indigeneCertificateService.markAsDownloaded(id);
                }
                catch (updateErr) {
                    console.error('Error marking certificate as downloaded:', updateErr);
                }
            });
        }
        catch (error) {
            console.error('Error processing request:', error.message);
            if (error.message === 'Certificate has already been downloaded.') {
                res.status(400).json({ message: error.message });
            }
            else {
                res.status(500).json({ message: 'Internal server error' });
            }
        }
    }
    async generateCertificatePDF(id, certificate) {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                margins: { top: 50, bottom: 50, left: 50, right: 50 },
            });
            const tempPath = `./temp/${id}.pdf`;
            const stream = fs.createWriteStream(tempPath);
            doc.pipe(stream);
            const borderSpacing = 20;
            const borderWidth = 8;
            doc
                .rect(borderSpacing, borderSpacing, doc.page.width - borderSpacing * 2, doc.page.height - borderSpacing * 2)
                .lineWidth(borderWidth)
                .strokeColor('red')
                .dash(10, { space: 4 })
                .stroke();
            const emblemX = doc.page.width / 2 - 25;
            const emblemY = 60;
            doc.rect(emblemX, emblemY, 50, 50).strokeColor('black').stroke();
            doc
                .font('Helvetica-Bold')
                .fontSize(20)
                .text('BENUE STATE', { align: 'center' })
                .moveDown(0.5);
            doc
                .font('Helvetica')
                .fontSize(12)
                .text('TO WHOM IT MAY CONCERN', { align: 'center' })
                .moveDown(1);
            doc
                .font('Helvetica-Bold')
                .fontSize(16)
                .text(`${certificate.LGA} Local Government Area`, { align: 'center' })
                .moveDown(0.5);
            doc
                .font('Helvetica')
                .fontSize(14)
                .text('Certificate of Benue State Origin', { align: 'center' })
                .moveDown(2);
            const startX = 70;
            let startY = 200;
            doc.font('Helvetica').fontSize(12).text(`I Certify that`, startX, startY);
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`${certificate.firstname}`, startX + 120, startY);
            startY += 20;
            doc
                .font('Helvetica')
                .fontSize(12)
                .text(`Is a native of:`, startX, startY);
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`${certificate.ward} `, startX + 120, startY);
            startY += 20;
            doc.font('Helvetica').fontSize(12).text(`Clan in:`, startX, startY);
            doc
                .font('Helvetica-Bold')
                .fontSize(12)
                .text(`${certificate.district}`, startX + 120, startY);
            startY += 40;
            doc
                .font('Helvetica')
                .fontSize(12)
                .text(`${certificate.LGA} Local Government Area`, { align: 'center' });
            doc
                .font('Helvetica')
                .fontSize(12)
                .text(`Benue State of Nigeria`, { align: 'center' })
                .moveDown(1);
            startY += 80;
            doc
                .font('Helvetica')
                .fontSize(12)
                .text(`Date: ${new Date().toDateString()}`, startX, startY);
            doc
                .font('Helvetica')
                .fontSize(12)
                .text(`Signature: _________________________`, startX + 250, startY);
            doc.end();
            stream.on('finish', () => resolve(tempPath));
            stream.on('error', (err) => reject(err));
        });
    }
    async getCertsRequset(req) {
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
    async getProfile(id, body) {
        return await this.indigeneCertificateService.findOne(id);
    }
    async getUserProfile(id, body) {
        return await this.indigeneCertificateService.findById(id);
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
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
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
], IndigeneCertificateController.prototype, "getCertsRequset", null);
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
exports.IndigeneCertificateController = IndigeneCertificateController = __decorate([
    (0, swagger_1.ApiTags)('indigene-certificate.controller'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/indigene/certificate'),
    __metadata("design:paramtypes", [indigene_certificate_service_1.IndigeneCertificateService,
        users_service_1.UsersService])
], IndigeneCertificateController);
//# sourceMappingURL=indigene-certificate.controller.js.map