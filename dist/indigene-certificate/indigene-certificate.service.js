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
exports.IndigeneCertificateService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const indigene_certicate_schema_1 = require("./indigene-certicate.schema");
const exception_1 = require("../common/exception");
const pdfkit_1 = __importDefault(require("pdfkit"));
const puppeteer = __importStar(require("puppeteer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let IndigeneCertificateService = class IndigeneCertificateService {
    constructor(certificateModel) {
        this.certificateModel = certificateModel;
        this.deleteItem = async (item_id) => {
            return await this.certificateModel.deleteOne({ _id: item_id });
        };
    }
    async createCertificate(data) {
        return this.certificateModel.create(data);
    }
    async findCertificateById(id) {
        return this.certificateModel.findById(id);
    }
    async findOne(id) {
        const certificate = await this.certificateModel.findOne({ userId: id });
        return certificate;
    }
    async findById(id) {
        const user = await this.certificateModel.findById(id);
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        return user;
    }
    async findApprovedRequest(page, limit, status) {
        const skip = (page - 1) * limit;
        const data = await this.certificateModel
            .find({ status })
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await this.certificateModel.countDocuments().exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async findRequestsByStatuses(page, limit, statuses) {
        const skip = (page - 1) * limit;
        const data = await this.certificateModel
            .find({ status: { $in: statuses } })
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await this.certificateModel
            .countDocuments({ status: { $in: statuses } })
            .exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async approveCertificate(id) {
        return this.certificateModel
            .findByIdAndUpdate(id, { status: 'Approved' }, { new: true })
            .exec();
    }
    async rejectCertificate(id, rejectionReason) {
        return this.certificateModel
            .findByIdAndUpdate(id, {
            status: 'Rejected',
            rejectionReason: rejectionReason,
            resubmissionAllowed: true,
        }, { new: true })
            .exec();
    }
    async resubmitRequest(id, updatedData) {
        const request = await this.certificateModel.findById(id);
        if (!request ||
            request.status !== 'Rejected' ||
            !request.resubmissionAllowed) {
            throw new Error('Request cannot be resubmitted.');
        }
        const MAX_RESUBMISSIONS = 3;
        if (request.resubmissionAttempts >= MAX_RESUBMISSIONS) {
            throw new Error('Maximum resubmission attempts reached.');
        }
        return this.certificateModel.findByIdAndUpdate(id, {
            ...updatedData,
            status: 'Pending',
            rejectionReason: null,
            resubmissionAllowed: false,
            $inc: { resubmissionAttempts: 1 },
        }, { new: true });
    }
    async getPaginatedData(page, limit) {
        const skip = (page - 1) * limit;
        const data = await this.certificateModel
            .find()
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await this.certificateModel.countDocuments().exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async markAsDownloaded(id) {
        await this.certificateModel.updateOne({ _id: id }, { $set: { downloaded: true } });
    }
    async reverseMarkAsDownloaded(id) {
        await this.certificateModel.updateOne({ _id: id }, { $set: { downloaded: false } });
    }
    async getAttestationTemplate(id, res) {
        const applicant = await this.certificateModel.findById(id);
        if (!applicant)
            throw new common_1.NotFoundException('User not found');
        const doc = new pdfkit_1.default();
        const date = new Date(applicant.DOB);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        res.setHeader('Content-Disposition', `attachment; filename=attestation_${id}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');
        doc.pipe(res);
        doc.fontSize(16).text('ATTESTATION LETTER FOR INDIGENE CERTIFICATE', {
            align: 'center',
        });
        doc.moveDown(2);
        doc.fontSize(12).text(`senderName`);
        doc.text(`senderAddress`);
        doc.text(`senderCity}, senderState`);
        doc.text(`senderPhone`);
        doc.text(`senderEmail`);
        doc.moveDown(1);
        doc.text(`${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown(2);
        doc.text(`The Chairman,`);
        doc.text(`${applicant.lgaOfOrigin}`);
        doc.text(`Benue State, Nigeria`).moveDown();
        doc
            .fontSize(14)
            .text(`Subject: Attestation of Indigene Certificate for ${applicant.firstname} ${applicant.lastname}`, { align: 'left' })
            .moveDown();
        doc.text(`Dear Sir/Madam,`).moveDown();
        doc
            .text(`I, "senderFistName" senderLastName, a native of ${applicant.ward}, in ${applicant.lgaOfOrigin} of Benue State, hereby write to formally attest that ${applicant.firstname} ${applicant.lastname}, who is a bona fide indigene of ${applicant.ward}, in ${applicant.lgaOfOrigin}, Benue State.`)
            .moveDown();
        doc
            .text(`${applicant.firstname} ${applicant.lastname} was born on ${formattedDate}, to ${applicant.fathersName} and ${applicant.mothersName}, both of whom are recognized natives of ${applicant.ward}. He/She has continuously identified with our community and has actively participated in cultural and communal activities, confirming his/her roots in this locality.`)
            .moveDown();
        doc
            .text(`This attestation is made in good faith and to the best of my knowledge, without any form of misrepresentation. I, therefore, request that the necessary indigene certificate be issued to ${applicant.firstname} ${applicant.lastname} for official purposes.`)
            .moveDown();
        doc
            .text(`Please do not hesitate to contact me should further clarification be required.`)
            .moveDown();
        doc.text(`Thank you for your cooperation.`).moveDown();
        doc.text(`Yours faithfully,`).moveDown();
        doc.text(`senderFirstName senderLastname`);
        doc
            .text('Authorized Signature: ___________________', { align: 'left' })
            .moveDown(2);
        doc.end();
        return {
            message: 'Download link generated',
            url: `example.com/download/${id}`,
        };
    }
    async uploadAttestation(id, file) {
        const applicant = await this.certificateModel.findById(id);
        if (!applicant)
            throw (0, exception_1.UserNotFoundException)();
        applicant.uploadedAttestationUrl = file.path;
        return applicant.save();
    }
    async generateCertificatePDF(id, html) {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A5',
            printBackground: true,
            margin: {
                top: '0px',
                right: '0px',
                bottom: '0px',
                left: '0px',
            },
            preferCSSPageSize: true,
        });
        await browser.close();
        const tempDir = path.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path.join(tempDir, `certificate_${id}.pdf`);
        await fs.promises.writeFile(tempFilePath, pdfBuffer);
        return tempFilePath;
    }
};
exports.IndigeneCertificateService = IndigeneCertificateService;
exports.IndigeneCertificateService = IndigeneCertificateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(indigene_certicate_schema_1.Certificate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], IndigeneCertificateService);
//# sourceMappingURL=indigene-certificate.service.js.map