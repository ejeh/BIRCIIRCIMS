"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const users_service_1 = require("./users/users.service");
const bodyParser = __importStar(require("body-parser"));
const configureApp = (app) => {
    app.use(bodyParser.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    }));
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
    const usersService = app.get(users_service_1.UsersService);
    (0, exports.configureApp)(app);
    (0, swagger_1.setupSwaggerDocuments)(app);
    await app.listen(config_1.default.port);
}
//# sourceMappingURL=bootsrap.js.map