"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSwaggerDocuments = exports.setupSwaggerDocument = void 0;
const swagger_1 = require("@nestjs/swagger");
const documents = [];
const setupSwaggerDocument = (path, config) => (module) => documents.push({ path, config, module });
exports.setupSwaggerDocument = setupSwaggerDocument;
const setupSwaggerDocuments = (app) => documents.forEach(({ path, config, module }) => {
    swagger_1.SwaggerModule.setup(`docs/${path}`, app, swagger_1.SwaggerModule.createDocument(app, config, { include: [module] }));
});
exports.setupSwaggerDocuments = setupSwaggerDocuments;
//# sourceMappingURL=swagger.js.map