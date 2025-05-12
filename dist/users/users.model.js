"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const users_schema_1 = require("./users.schema");
exports.UserModel = mongoose_1.MongooseModule.forFeature([
    { name: 'User', schema: users_schema_1.UserSchema },
]);
//# sourceMappingURL=users.model.js.map