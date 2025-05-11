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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EducationalHistorySchema = exports.EducationalHistory = exports.TertiaryInfoSchema = exports.TertiaryInfo = exports.SchoolInfoSchema = exports.SchoolInfo = void 0;
const mongoose_1 = require("mongoose");
const mongoose_2 = require("@nestjs/mongoose");
let SchoolInfo = class SchoolInfo extends mongoose_1.Document {
};
exports.SchoolInfo = SchoolInfo;
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], SchoolInfo.prototype, "name", void 0);
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], SchoolInfo.prototype, "address", void 0);
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], SchoolInfo.prototype, "yearOfAttendance", void 0);
exports.SchoolInfo = SchoolInfo = __decorate([
    (0, mongoose_2.Schema)()
], SchoolInfo);
exports.SchoolInfoSchema = mongoose_2.SchemaFactory.createForClass(SchoolInfo);
let TertiaryInfo = class TertiaryInfo extends mongoose_1.Document {
};
exports.TertiaryInfo = TertiaryInfo;
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], TertiaryInfo.prototype, "name", void 0);
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], TertiaryInfo.prototype, "address", void 0);
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], TertiaryInfo.prototype, "certificateObtained", void 0);
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], TertiaryInfo.prototype, "matricNo", void 0);
__decorate([
    (0, mongoose_2.Prop)({ required: false }),
    __metadata("design:type", String)
], TertiaryInfo.prototype, "yearOfAttendance", void 0);
exports.TertiaryInfo = TertiaryInfo = __decorate([
    (0, mongoose_2.Schema)()
], TertiaryInfo);
exports.TertiaryInfoSchema = mongoose_2.SchemaFactory.createForClass(TertiaryInfo);
let EducationalHistory = class EducationalHistory extends mongoose_1.Document {
};
exports.EducationalHistory = EducationalHistory;
__decorate([
    (0, mongoose_2.Prop)({ type: exports.SchoolInfoSchema, required: false }),
    __metadata("design:type", SchoolInfo)
], EducationalHistory.prototype, "primarySchool", void 0);
__decorate([
    (0, mongoose_2.Prop)({ type: exports.SchoolInfoSchema, required: false }),
    __metadata("design:type", SchoolInfo)
], EducationalHistory.prototype, "secondarySchool", void 0);
__decorate([
    (0, mongoose_2.Prop)({ type: [exports.TertiaryInfoSchema], required: false }),
    __metadata("design:type", Array)
], EducationalHistory.prototype, "tertiaryInstitutions", void 0);
exports.EducationalHistory = EducationalHistory = __decorate([
    (0, mongoose_2.Schema)()
], EducationalHistory);
exports.EducationalHistorySchema = mongoose_2.SchemaFactory.createForClass(EducationalHistory);
//# sourceMappingURL=users.education.schema.js.map