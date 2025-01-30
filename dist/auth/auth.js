"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOriginHeader = exports.comparePassword = exports.hashPassword = void 0;
const bcrypt = require("bcryptjs");
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