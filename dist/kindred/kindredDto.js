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
exports.UpdateKindredDto = exports.SigUpKindredDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SigUpKindredDto {
}
exports.SigUpKindredDto = SigUpKindredDto;
__decorate([
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "firstname", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "lastname", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(11),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], SigUpKindredDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(11),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], SigUpKindredDto.prototype, "NIN", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({}),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "kindred", void 0);
__decorate([
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "lga", void 0);
__decorate([
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "stateOfOrigin", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'email@email.com', maxLength: 255 }),
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password', minLength: 8 }),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], SigUpKindredDto.prototype, "password", void 0);
class UpdateKindredDto {
}
exports.UpdateKindredDto = UpdateKindredDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateKindredDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(11),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", Number)
], UpdateKindredDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateKindredDto.prototype, "kindred", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.MaxLength)(255),
    (0, swagger_1.ApiProperty)({}),
    __metadata("design:type", String)
], UpdateKindredDto.prototype, "middlename", void 0);
//# sourceMappingURL=kindredDto.js.map