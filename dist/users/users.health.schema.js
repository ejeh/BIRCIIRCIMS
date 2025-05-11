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
exports.HealthInfoSchema = exports.HealthInfo = exports.DisabilityStatus = exports.Genotype = exports.BloodGroup = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var BloodGroup;
(function (BloodGroup) {
    BloodGroup["A_POSITIVE"] = "A+";
    BloodGroup["A_NEGATIVE"] = "A-";
    BloodGroup["B_POSITIVE"] = "B+";
    BloodGroup["B_NEGATIVE"] = "B-";
    BloodGroup["AB_POSITIVE"] = "AB+";
    BloodGroup["AB_NEGATIVE"] = "AB-";
    BloodGroup["O_POSITIVE"] = "O+";
    BloodGroup["O_NEGATIVE"] = "O-";
})(BloodGroup || (exports.BloodGroup = BloodGroup = {}));
var Genotype;
(function (Genotype) {
    Genotype["AA"] = "AA";
    Genotype["AS"] = "AS";
    Genotype["SS"] = "SS";
    Genotype["AC"] = "AC";
})(Genotype || (exports.Genotype = Genotype = {}));
var DisabilityStatus;
(function (DisabilityStatus) {
    DisabilityStatus["NONE"] = "None";
    DisabilityStatus["PHYSICAL"] = "Physical";
    DisabilityStatus["VISUAL"] = "Visual";
    DisabilityStatus["HEARING"] = "Hearing";
    DisabilityStatus["MENTAL"] = "Mental";
    DisabilityStatus["OTHER"] = "Other";
})(DisabilityStatus || (exports.DisabilityStatus = DisabilityStatus = {}));
let HealthInfo = class HealthInfo extends mongoose_2.Document {
};
exports.HealthInfo = HealthInfo;
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: BloodGroup,
        required: false,
        default: null,
    }),
    __metadata("design:type", String)
], HealthInfo.prototype, "bloodGroup", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: Genotype, required: false, default: null }),
    __metadata("design:type", String)
], HealthInfo.prototype, "genotype", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: String,
        enum: DisabilityStatus,
        default: DisabilityStatus.NONE,
    }),
    __metadata("design:type", String)
], HealthInfo.prototype, "disabilityStatus", void 0);
exports.HealthInfo = HealthInfo = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], HealthInfo);
exports.HealthInfoSchema = mongoose_1.SchemaFactory.createForClass(HealthInfo);
//# sourceMappingURL=users.health.schema.js.map