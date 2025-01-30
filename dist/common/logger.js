"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bunyan = require("bunyan");
const helpers_1 = require("./helpers");
exports.default = bunyan.createLogger({
    name: 'logger',
    streams: [
        {
            stream: process.stdout,
        },
        {
            type: 'rotating-file',
            path: (0, helpers_1.createLogsDirectory)() + '/logs.log',
        },
    ],
});
//# sourceMappingURL=logger.js.map