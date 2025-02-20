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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOriginHeader = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt = __importStar(require("bcryptjs"));
const hashPassword = async (password) => await bcrypt.hash(password, await bcrypt.genSalt(parseInt(process.env.AUTH_SALT_ROUNDS, 10)));
exports.hashPassword = hashPassword;
const comparePassword = (password, hash) => bcrypt.compareSync(password, hash);
exports.comparePassword = comparePassword;
const getOriginHeader = ({ headers: { origin } }) => {
    if (origin) {
        return typeof origin === 'string' ? origin : origin[0];
    }
    return '';
};
exports.getOriginHeader = getOriginHeader;
//# sourceMappingURL=auth.js.map