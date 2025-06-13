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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CertificateSchema = exports.Certificate = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose = __importStar(require("mongoose"));
const swagger_1 = require("@nestjs/swagger");
const mongoose_2 = require("mongoose");
let Certificate = class Certificate extends mongoose_2.Document {
};
exports.Certificate = Certificate;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Certificate ID',
        example: '1234567890',
    }),
    (0, mongoose_1.Prop)({
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true,
    }),
    __metadata("design:type", String)
], Certificate.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: mongoose.SchemaTypes.String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    }),
    __metadata("design:type", String)
], Certificate.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", String)
], Certificate.prototype, "rejectionReason", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Certificate.prototype, "resubmissionAllowed", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Certificate.prototype, "resubmissionAttempts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], Certificate.prototype, "downloaded", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "firstname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, require: true }),
    __metadata("design:type", String)
], Certificate.prototype, "middlename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.Date, required: true }),
    __metadata("design:type", Date)
], Certificate.prototype, "DOB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "maritalStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "stateOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "lgaOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "ward", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: mongoose.SchemaTypes.String,
        required: true,
    }),
    __metadata("design:type", Number)
], Certificate.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "kindred", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "fathersName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "fathersStateOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "mothersName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "mothersStateOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false }),
    __metadata("design:type", String)
], Certificate.prototype, "guardian", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false }),
    __metadata("design:type", String)
], Certificate.prototype, "relationshionToguardian", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", String)
], Certificate.prototype, "purpose", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", String)
], Certificate.prototype, "refNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "passportPhoto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "idCard", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Certificate.prototype, "birthCertificate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], Certificate.prototype, "parentGuardianIndigeneCert", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: null }),
    __metadata("design:type", String)
], Certificate.prototype, "uploadedAttestationUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: false, default: null }),
    __metadata("design:type", String)
], Certificate.prototype, "qrCodeUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], Certificate.prototype, "isValid", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", String)
], Certificate.prototype, "verificationHash", void 0);
exports.Certificate = Certificate = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    })
], Certificate);
exports.CertificateSchema = mongoose_1.SchemaFactory.createForClass(Certificate);
//# sourceMappingURL=indigene-certicate.schema.js.map