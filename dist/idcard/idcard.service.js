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
exports.IdcardService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const idcard_schema_1 = require("./idcard.schema");
const exception_1 = require("../common/exception");
const puppeteer_1 = __importDefault(require("puppeteer"));
const path_1 = __importDefault(require("path"));
const fs = __importStar(require("fs"));
const mongoose_3 = require("mongoose");
let IdcardService = class IdcardService {
    constructor(idCardModel) {
        this.idCardModel = idCardModel;
        this.deleteItem = async (item_id) => {
            return await this.idCardModel.deleteOne({ _id: item_id });
        };
    }
    async generateUniqueNumber() {
        const part1 = Math.floor(1000 + Math.random() * 9000);
        const part2 = Math.floor(100 + Math.random() * 900);
        const part3 = Math.floor(1000 + Math.random() * 9000);
        return `${part1} ${part2} ${part3}`;
    }
    async generateUniqueBIN() {
        let bin;
        let exists;
        do {
            bin = await this.generateUniqueNumber();
            exists = await this.idCardModel.findOne({ bin });
        } while (exists);
        return bin;
    }
    async createIdCard(data) {
        return this.idCardModel.create(data);
    }
    async findCardById(id) {
        return this.idCardModel.findById(id);
    }
    async findById(id) {
        const user = await this.idCardModel
            .findById(id)
            .populate('userId', 'firstname lastname email passportPhoto')
            .exec();
        if (!user) {
            throw (0, exception_1.UserNotFoundException)();
        }
        return user;
    }
    async findOne(id) {
        const idCard = await this.idCardModel.findOne({ userId: id });
        return idCard;
    }
    async findCardRequestsByStatuses(page, limit, statuses) {
        const skip = (page - 1) * limit;
        const data = await this.idCardModel
            .find({ status: { $in: statuses } })
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await this.idCardModel
            .countDocuments({ status: { $in: statuses } })
            .exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async approveIdCard(id) {
        return this.idCardModel
            .findByIdAndUpdate(id, { status: 'Approved' }, { new: true })
            .exec();
    }
    async rejectCard(id, rejectionReason) {
        return this.idCardModel
            .findByIdAndUpdate(id, {
            status: 'Rejected',
            rejectionReason: rejectionReason,
            resubmissionAllowed: true,
        }, { new: true })
            .exec();
    }
    async findCertificateById(id) {
        return this.idCardModel.findById(id);
    }
    async markAsDownloaded(id) {
        await this.idCardModel.updateOne({ _id: id }, { $set: { downloaded: true } });
    }
    async generateIDCardPDF(id, html) {
        const browser = await puppeteer_1.default.launch({
            headless: true,
            executablePath: '/usr/bin/google-chrome',
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            printBackground: true,
            margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
            preferCSSPageSize: true,
            scale: 1,
        });
        await browser.close();
        const tempDir = path_1.default.join(__dirname, '..', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const tempFilePath = path_1.default.join(tempDir, `id_card_${id}.pdf`);
        await fs.promises.writeFile(tempFilePath, pdfBuffer);
        return tempFilePath;
    }
    async resubmitRequest(id, updatedData) {
        const request = await this.idCardModel.findById(id);
        if (!request ||
            request.status !== 'Rejected' ||
            !request.resubmissionAllowed) {
            throw new Error('Request cannot be resubmitted.');
        }
        const MAX_RESUBMISSIONS = 3;
        if (request.resubmissionAttempts >= MAX_RESUBMISSIONS) {
            throw new Error('Maximum resubmission attempts reached.');
        }
        return this.idCardModel.findByIdAndUpdate(id, {
            ...updatedData,
            status: 'Pending',
            rejectionReason: null,
            resubmissionAllowed: false,
            $inc: { resubmissionAttempts: 1 },
        }, { new: true });
    }
    async verifyCertificate(cardId, hash) {
        const card = await this.idCardModel.findOne({
            _id: new mongoose_3.Types.ObjectId(cardId),
            verificationHash: hash,
        });
        if (!card) {
            return { valid: false, message: 'Certificate not found' };
        }
        if (!card.isValid) {
            return { valid: false, message: 'Certificate has been revoked' };
        }
        return {
            valid: true,
            data: {
                bin: card.bin,
                firstname: card.firstname,
                lastname: card.lastname,
                issuingAuthority: 'Benue State citizenship/residency management system',
            },
        };
    }
    async saveVerificationHash(cardId, hash) {
        try {
            const result = await this.idCardModel.updateOne({ _id: new mongoose_3.Types.ObjectId(cardId) }, { $set: { verificationHash: hash } });
            return result;
        }
        catch (error) {
            console.error('Error updating verification hash:', error);
            throw error;
        }
    }
};
exports.IdcardService = IdcardService;
exports.IdcardService = IdcardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(idcard_schema_1.IdCard.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], IdcardService);
//# sourceMappingURL=idcard.service.js.map