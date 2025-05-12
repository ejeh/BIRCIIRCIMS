"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KindredSchema = void 0;
const mongoose_1 = require("mongoose");
exports.KindredSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    firstname: { type: String, required: true },
    lastname: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },
    kindred: {
        type: String,
        required: true,
    },
    lga: {
        type: String,
        required: true,
    },
    stateOfOrigin: {
        type: String,
        required: true,
    },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });
//# sourceMappingURL=kindred.schema.js.map