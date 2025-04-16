"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KindredModel = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const kindred_schema_1 = require("./kindred.schema");
exports.KindredModel = mongoose_1.MongooseModule.forFeature([
    { name: 'Kindred', schema: kindred_schema_1.KindredSchema },
]);
//# sourceMappingURL=kindred.model.js.map