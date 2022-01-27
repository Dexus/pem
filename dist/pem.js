"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ca_1 = require("./ca");
const debug_1 = require("./debug");
const convert_1 = require("./convert");
const helper_1 = require("./helper");
const openssl_1 = require("./openssl");
function run() {
    return (0, tslib_1.__awaiter)(this, void 0, void 0, function* () {
        console.log("Versions", (0, openssl_1.get)());
        console.log(convert_1.name);
        console.log(ca_1.name);
        console.log(helper_1.name);
        console.log(openssl_1.name);
        (0, debug_1.debug)("Versions", (0, openssl_1.get)());
        yield new Promise((resolve) => {
            setTimeout(() => {
                resolve(true);
            }, 1500);
        });
        console.log("Versions", (0, openssl_1.get)());
    });
}
run();
//# sourceMappingURL=pem.js.map