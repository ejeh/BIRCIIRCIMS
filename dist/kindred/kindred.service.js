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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KindredService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let KindredService = class KindredService {
    constructor(kindredModel) {
        this.kindredModel = kindredModel;
        this.createKindred = async (payload) => {
            const emailExists = await this.kindredModel.findOne({
                email: payload.email,
            });
            if (emailExists) {
                throw new common_1.HttpException('Email already exists', common_1.HttpStatus.BAD_REQUEST);
            }
            const phoneExists = await this.kindredModel.findOne({
                phone: payload.phone,
            });
            if (phoneExists) {
                throw new common_1.HttpException('Phone number already exists', common_1.HttpStatus.BAD_REQUEST);
            }
            const kindredExists = await this.kindredModel.findOne({
                kindred: payload.kindred,
            });
            if (kindredExists) {
                throw new common_1.HttpException('Kindred already exists', common_1.HttpStatus.BAD_REQUEST);
            }
            return this.kindredModel.create({
                ...payload,
            });
        };
        this.deleteItem = async (item_id) => {
            return await this.kindredModel.deleteOne({ _id: item_id });
        };
    }
    async getPaginatedData(page, limit) {
        const skip = (page - 1) * limit;
        const data = await this.kindredModel.find().skip(skip).limit(limit).exec();
        const totalCount = await this.kindredModel.countDocuments().exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async getkindredHeads(userId, page, limit) {
        const skip = (page - 1) * limit;
        const data = await this.kindredModel
            .find({ userId })
            .skip(skip)
            .limit(limit)
            .exec();
        const totalCount = await this.kindredModel
            .countDocuments({ userId })
            .exec();
        return {
            data,
            hasNextPage: skip + limit < totalCount,
        };
    }
    async updateKindred(id, updatedData) {
        const kindred = await this.kindredModel.findByIdAndUpdate(id, updatedData, {
            new: true,
        });
        try {
            if (!kindred) {
                throw new common_1.HttpException('Kindred not found', common_1.HttpStatus.NOT_FOUND);
            }
            return kindred;
        }
        catch (error) {
            throw new common_1.HttpException(error.message || 'An error occurred while updating the profile', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.KindredService = KindredService;
exports.KindredService = KindredService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)('Kindred')),
    __metadata("design:paramtypes", [mongoose_2.Model])
], KindredService);
//# sourceMappingURL=kindred.service.js.map