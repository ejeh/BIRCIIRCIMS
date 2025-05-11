"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionSchema = void 0;
const mongoose_1 = require("mongoose");
exports.TransactionSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    cardId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'IdCard',
        required: function () {
            return this.paymentType === 'card';
        },
    },
    certificateId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Certificate',
        required: function () {
            return this.paymentType === 'certificate';
        },
    },
    reference: { type: String, unique: true },
    amount: { type: Number, required: true },
    email: { type: String, required: true },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'success', 'failed'],
        default: 'pending',
    },
    currency: { type: String, default: 'NGN' },
    paymentType: {
        type: String,
        required: true,
        enum: ['card', 'certificate'],
    },
    customer: {
        firstname: String,
        lastname: String,
        email: String,
        phoneNo: String,
    },
    verified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
//# sourceMappingURL=transaction.schema.js.map