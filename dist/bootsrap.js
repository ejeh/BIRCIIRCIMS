"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureApp = void 0;
exports.bootstrap = bootstrap;
const helmet_1 = __importDefault(require("helmet"));
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("./common/swagger");
const app_module_1 = require("./app.module");
const path_1 = require("path");
const config_1 = __importDefault(require("./config"));
const configureApp = (app) => {
    app.use((req, res, next) => {
        next();
    });
    if (config_1.default.cors) {
        app.enableCors(config_1.default.cors);
    }
    app.use((0, helmet_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
};
exports.configureApp = configureApp;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'));
    (0, exports.configureApp)(app);
    (0, swagger_1.setupSwaggerDocuments)(app);
    await app.listen(config_1.default.port);
}
//# sourceMappingURL=bootsrap.js.map