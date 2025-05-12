"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmploymentHistorySchema = void 0;
const mongoose_1 = require("mongoose");
exports.EmploymentHistorySchema = new mongoose_1.Schema({
    companyName: { type: String, required: true },
    address: { type: String, required: true },
    designation: { type: String, required: true },
    startYear: { type: Number, required: true },
    endYear: { type: Number },
    isCurrentEmployment: { type: Boolean, default: false },
    description: { type: String },
});
//# sourceMappingURL=users.emploment.schema.js.map