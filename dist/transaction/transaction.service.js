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
exports.TransactionService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = __importStar(require("mongoose"));
const mongoose_2 = require("@nestjs/mongoose");
const axios_1 = __importDefault(require("axios"));
const indigene_certificate_service_1 = require("../indigene-certificate/indigene-certificate.service");
let TransactionService = class TransactionService {
    constructor(transactionModel, indigeneCertificateService) {
        this.transactionModel = transactionModel;
        this.indigeneCertificateService = indigeneCertificateService;
        this.baseUrl = 'https://api.credodemo.com';
        this.secretKey = process.env.CREDO_SECRET_KEY;
    }
    async initializePayment(data) {
        const bearer = 0;
        const userObjectId = new mongoose_1.default.Types.ObjectId(data.userId);
        let paymentReference = null;
        if (data.paymentType === 'card' && data.cardId) {
            paymentReference = { cardId: new mongoose_1.default.Types.ObjectId(data.cardId) };
        }
        else if (data.paymentType === 'certificate' && data.certificateId) {
            paymentReference = {
                certificateId: new mongoose_1.default.Types.ObjectId(data.certificateId),
            };
        }
        else {
            throw new Error('Invalid payment type or missing identifier');
        }
        const existing = await this.transactionModel.findOne({
            userId: userObjectId,
            ...(data.paymentType === 'card' &&
                paymentReference.cardId && { cardId: paymentReference.cardId }),
            ...(data.paymentType === 'certificate' &&
                paymentReference.certificateId && {
                certificateId: paymentReference.certificateId,
            }),
            status: 'pending',
        });
        console.log('existing', existing);
        if (existing) {
            return {
                status: 200,
                message: 'Existing transaction found',
                data: { reference: existing.reference },
            };
        }
        const reference = data.reference ||
            `ref-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
        const newTransaction = new this.transactionModel({
            userId: userObjectId,
            reference,
            amount: data.amount,
            email: data.email,
            status: 'pending',
            currency: data.currency || 'NGN',
            paymentType: data.paymentType,
            ...paymentReference,
        });
        await newTransaction.save();
        try {
            const payload = {
                amount: data.amount,
                reference,
                bearer: 0,
                currency: data.currency || 'NGN',
                email: data.email,
                customer: {
                    email: data.email,
                },
            };
            const headers = {
                Authorization: this.secretKey,
                'Content-Type': 'application/json',
            };
            const url = `${this.baseUrl}/transaction/initialize`;
            const credoResponse = await axios_1.default.post(url, payload, { headers });
            return {
                status: 200,
                message: 'Transaction initialized',
                data: {
                    reference,
                },
            };
        }
        catch (err) {
            console.error('Credo init error:', err?.response?.data || err.message);
            throw new Error('Credo payment initialization failed');
        }
    }
    async verifyPayment(reference) {
        const url = `${this.baseUrl}/transaction/${reference}/verify`;
        const headers = { Authorization: `${this.secretKey}` };
        const transaction = await this.transactionModel.findOne({
            reference,
        });
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.status !== 'pending') {
            throw new Error('Transaction already processed');
        }
        const response = await axios_1.default.get(url, { headers });
        if (response.data.status === 200) {
            await this.transactionModel.findOneAndUpdate({ reference }, { status: 'successful' });
        }
        else {
            await this.transactionModel.findOneAndUpdate({ reference }, { status: 'failed' });
        }
        return response.data;
    }
    async getUserTransactions(userId) {
        return this.transactionModel.find({ userId }).sort({ createdAt: -1 });
    }
    async getPaginatedData(page, limit) {
        const skip = (page - 1) * limit;
        const data = await this.transactionModel
            .find()
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await this.transactionModel.countDocuments().exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async getApprovedItems() {
        const completedPayments = await this.transactionModel
            .find({ status: 'successful' })
            .populate('certificateId')
            .exec();
        console.log('Completed Payments:', completedPayments);
        const itemIds = completedPayments.map((payment) => {
            if (!mongoose_1.Types.ObjectId.isValid(payment.certificateId)) {
                throw new Error(`Invalid ObjectId: ${payment.certificateId}`);
            }
            return payment.certificateId.toString();
        });
        const approvedItems = await this.indigeneCertificateService.findByIds(itemIds);
        return approvedItems;
    }
    async handleCredoWebhook(payload) {
        console.log('Credo Webhook Payload:', payload);
        const { reference, amount, status, customer } = payload;
        const existing = await this.transactionModel.findOne({ reference });
        if (existing) {
            console.log(`Transaction with reference ${reference} already exists. Skipping...`);
            return;
        }
        const event = payload?.event;
        const data = payload?.data;
        if (!event || !data) {
            return { status: 'ignored', reason: 'No event or data in payload' };
        }
        if (event === 'TRANSACTION.SUCCESSFUL' && data.status === 0) {
            const reference = data.businessRef;
            const amount = data.transAmount;
            const transaction = await this.transactionModel.findOne({ reference });
            if (!transaction.verified) {
                transaction.status = 'success';
                transaction.verified = true;
                transaction.amount = amount;
                transaction.customer = {
                    firstname: data.customer.firstName,
                    lastname: data.customer.lastName,
                    email: data.customer.customerEmail,
                    phoneNo: data.customer.phoneNo,
                };
                await transaction.save();
                return { status: 'verified', reference };
            }
            else {
                return { status: 'already verified', reference };
            }
        }
        return { status: 'no action taken', event };
    }
};
exports.TransactionService = TransactionService;
exports.TransactionService = TransactionService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_2.InjectModel)('Transaction')),
    __metadata("design:paramtypes", [mongoose_1.Model,
        indigene_certificate_service_1.IndigeneCertificateService])
], TransactionService);
//# sourceMappingURL=transaction.service.js.map