"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KindredModule = void 0;
const common_1 = require("@nestjs/common");
const kindred_controller_1 = require("./kindred.controller");
const mongoose_1 = require("@nestjs/mongoose");
const kindred_schema_1 = require("./kindred.schema");
const kindred_service_1 = require("./kindred.service");
let KindredModule = class KindredModule {
};
exports.KindredModule = KindredModule;
exports.KindredModule = KindredModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: 'Kindred', schema: kindred_schema_1.KindredSchema }]),
        ],
        controllers: [kindred_controller_1.KindredController],
        providers: [kindred_service_1.KindredService],
    })
], KindredModule);
//# sourceMappingURL=kindred.module.js.map