"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("../config");
const swagger_2 = require("../common/swagger");
exports.default = (0, swagger_2.setupSwaggerDocument)('account', new swagger_1.DocumentBuilder()
    .addBearerAuth()
    .addServer(config_1.default.host)
    .setTitle('Account Docs')
    .setDescription('Basic account features')
    .setVersion('1.0')
    .setBasePath('')
    .addTag('account')
    .build());
//# sourceMappingURL=users.swagger.js.map