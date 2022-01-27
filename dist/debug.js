"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.name = void 0;
exports.name = "debug";
function debug(title, content) {
    if (process.env.CI === 'true') {
        console.info(`::group::${title}`);
        console.debug(JSON.stringify(content, null, 3));
        console.info('::endgroup::');
    }
}
exports.debug = debug;
//# sourceMappingURL=debug.js.map