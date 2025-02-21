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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.User = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose = __importStar(require("mongoose"));
const swagger_1 = require("@nestjs/swagger");
const users_role_enum_1 = require("./users.role.enum");
const users_next_of_kin_schema_1 = require("./users.next-of-kin.schema");
const users_emploment_schema_1 = require("./users.emploment.schema");
const users_business_schema_1 = require("./users.business.schema");
const users_education_schema_1 = require("./users.education.schema");
const users_health_schema_1 = require("./users.health.schema");
const users_neigbour_schema_1 = require("./users.neigbour.schema");
const users_family_schema_1 = require("./users.family.schema");
let User = class User {
};
exports.User = User;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], User.prototype, "firstname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], User.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, require: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "middlename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.Date, required: false, default: null }),
    __metadata("design:type", Date)
], User.prototype, "DOB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "maritalStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "stateOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "lgaOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "stateOfResidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "lgaOfResidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "house_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "street_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "nearest_bus_stop_landmark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "city_town", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "countryOfResidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "identification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "id_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "issue_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "expiry_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ required: false }),
    __metadata("design:type", String)
], User.prototype, "passportPhoto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [users_next_of_kin_schema_1.NextOfKinSchema], required: false, default: null }),
    __metadata("design:type", Array)
], User.prototype, "nextOfKin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [users_emploment_schema_1.EmploymentHistorySchema], required: false, default: null }),
    __metadata("design:type", Array)
], User.prototype, "employmentHistory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [users_business_schema_1.BusinessSchema], required: false, default: null }),
    __metadata("design:type", Array)
], User.prototype, "business", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: users_education_schema_1.EducationalHistorySchema, required: false, default: null }),
    __metadata("design:type", users_education_schema_1.EducationalHistory)
], User.prototype, "educationalHistory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [users_health_schema_1.HealthInfoSchema], required: false, default: null }),
    __metadata("design:type", Array)
], User.prototype, "healthInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [users_neigbour_schema_1.NeighborSchema], required: false, default: null }),
    __metadata("design:type", Array)
], User.prototype, "neighbor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: [users_family_schema_1.FamilySchema], required: false, default: null }),
    __metadata("design:type", Array)
], User.prototype, "family", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: mongoose.SchemaTypes.String,
        required: true,
        unique: true,
    }),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "NIN", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({
        type: mongoose.SchemaTypes.String,
        default: users_role_enum_1.UserRole.USER,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false, default: null }),
    __metadata("design:type", String)
], User.prototype, "religion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: false }),
    __metadata("design:type", String)
], User.prototype, "community", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String, required: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.Boolean, default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", String)
], User.prototype, "passwordResetToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", String)
], User.prototype, "activationToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, mongoose_1.Prop)({ type: mongoose.SchemaTypes.String }),
    __metadata("design:type", Date)
], User.prototype, "activationExpires", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
exports.UserSchema.methods.getPublicData = function () {
    const { id, email, firstname, lastname, role, LGA, address, phone, DOB, gender, nationality, stateOfOrigin, middlename, } = this;
    return {
        id,
        email,
        firstname,
        lastname,
        role,
        middlename,
        stateOfOrigin,
        gender,
        DOB,
        nationality,
        phone,
        LGA,
        address,
    };
};
//# sourceMappingURL=users.schema.js.map