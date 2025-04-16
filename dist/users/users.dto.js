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
exports.UpdateUserRoleDto = exports.UpdateProfileDto = exports.UserPublicData = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class UserPublicData {
}
exports.UserPublicData = UserPublicData;
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "firstname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "middlename", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "DOB", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], UserPublicData.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "community", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "religion", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "stateOfOrigin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "nationality", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "maritalStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "nextOfKin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "employmentHistory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "business", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "educationalHistory", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "healthInfo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], UserPublicData.prototype, "NIN", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "house_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "street_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "nearest_bus_stop_landmark", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "city_town", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "countryOfResidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "identification", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "id_number", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "issue_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "expiry_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "TIN", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "stateOfResidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "lgaOfResidence", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UserPublicData.prototype, "lgaOfOrigin", void 0);
class UpdateProfileDto {
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "passportPhoto", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lastname", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "community", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "religion", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "middlename", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "house_number", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "maritalStatus", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lgaOfOrigin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "stateOfOrigin", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "street_name", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "nearest_bus_stop_landmark", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "city_town", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "countryOfResidence", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "nationality", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "DOB", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "nextOfKin", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "employmentHistory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "business", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "neighbor", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "educationalHistory", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "healthInfo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "family", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "identification", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "id_number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "issue_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "expiry_date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "stateOfResidence", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "lgaOfResidence", void 0);
class UpdateUserRoleDto {
}
exports.UpdateUserRoleDto = UpdateUserRoleDto;
__decorate([
    (0, swagger_1.ApiProperty)({}),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateUserRoleDto.prototype, "role", void 0);
//# sourceMappingURL=users.dto.js.map