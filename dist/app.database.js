"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const config_1 = require("./config");
exports.DatabaseModule = mongoose_1.MongooseModule.forRoot(config_1.dbUrl);
//# sourceMappingURL=app.database.js.map