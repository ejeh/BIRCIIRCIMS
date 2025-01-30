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
exports.IndigeneCertificateService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const indigene_certicate_schema_1 = require("./indigene-certicate.schema");
const exception_1 = require("../common/exception");
const PDFDocument = require("pdfkit");
let IndigeneCertificateService = class IndigeneCertificateService {
    constructor(certificateModel) {
        this.certificateModel = certificateModel;
    }
    async createCertificate(data) {
        return this.certificateModel.create(data);
    }
    async findCertificateById(id) {
        return this.certificateModel.findById(id);
    }
    async findOne(id) {
        const certicate = await this.certificateModel.findOne({ userId: id });
        return certicate;
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
        const doc = new PDFDocument();
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
        doc.text(`${applicant.LGA}`);
        doc.text(`Benue State, Nigeria`).moveDown();
        doc
            .fontSize(14)
            .text(`Subject: Attestation of Indigene Certificate for ${applicant.firstname} ${applicant.lastname}`, { align: 'left' })
            .moveDown();
        doc.text(`Dear Sir/Madam,`).moveDown();
        doc
            .text(`I, "senderFistName" senderLastName, a native of ${applicant.ward}, in ${applicant.LGA} of Benue State, hereby write to formally attest that ${applicant.firstname} ${applicant.lastname}, who is a bona fide indigene of ${applicant.ward}, in ${applicant.LGA}, Benue State.`)
            .moveDown();
        doc
            .text(`${applicant.firstname} ${applicant.lastname} was born on ${applicant.DOB}, to ${applicant.fathersName} and ${applicant.mothersName}, both of whom are recognized natives of ${applicant.ward}. He/She has continuously identified with our community and has actively participated in cultural and communal activities, confirming his/her roots in this locality.`)
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
};
exports.IndigeneCertificateService = IndigeneCertificateService;
exports.IndigeneCertificateService = IndigeneCertificateService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(indigene_certicate_schema_1.Certificate.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], IndigeneCertificateService);
//# sourceMappingURL=indigene-certificate.service.js.map