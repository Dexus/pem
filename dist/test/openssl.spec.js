"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const debug_1 = require("../src/debug");
const openssl = (0, tslib_1.__importStar)(require("../src/openssl"));
const chai_1 = (0, tslib_1.__importStar)(require("chai"));
const dirty_chai_1 = (0, tslib_1.__importDefault)(require("dirty-chai"));
const hlp = require("./pem.helper.js");
chai_1.default.use(dirty_chai_1.default);
// NOTE: we cover here only the test cases left in coverage report
describe("openssl.js tests", function () {
    this.timeout(300000); // 5 minutes
    this.slow(2000); // 2 seconds
    describe("#.exec()", function () {
        it("search string not found", function (done) {
            openssl.exec(function (error) {
                hlp.checkError(error, true);
                done();
            }, [
                "dhparam",
                "-outform",
                "PEM",
                1024
            ], "DH PARAMETERS 1024");
        });
    });
    describe("#.get(\"openSslVersion\")", function () {
        it("get Version", function (done) {
            (0, debug_1.debug)("Settings", openssl.get());
            if (process.env.LIBRARY && process.env.VERSION) {
                (0, chai_1.expect)(process.env.LIBRARY.toUpperCase()).to.equal(openssl.get("Vendor"));
                (0, chai_1.expect)(process.env.VERSION).to.equal(openssl.get("VendorVersion") + (openssl.get("VendorVersionBuildChar") || ""));
            }
            done();
        });
    });
    describe("#.execBinary()", function () {
        it("no tmpfiles parameter", function (done) {
            openssl.execBinary(function (error, result) {
                hlp.checkError(error);
                (0, chai_1.expect)(result).to.be.ok();
                done();
            }, [
                "dhparam",
                "-outform",
                "PEM",
                1024
            ]);
        });
    });
    describe("#.spawn()", function () {
        it.skip("error case [openssl return code 2]", function (done) {
            // TODO; couldn't figure an example out
            done();
        });
        // TODO; I expect some more cases in here or code cleanup required
        /**
         *
         *
         * The exit codes for smime are as follows:
         *
         * 0   The operation was completely successful.
         * 1   An error occurred parsing the command options.
         * 2   One of the input files could not be read.
         * 3   An error occurred creating the file or when reading the message.
         * 4   An error occurred decrypting or verifying the message.
         * 5   An error occurred writing certificates.
         *
         * The exit codes for cms are as follows:
         *
         * 0   The operation was completely successful.
         * 1   An error occurred parsing the command options.
         * 2   One of the input files could not be read.
         * 3   An error occurred creating the CMS file or when reading the MIME message.
         * 4   An error occurred decrypting or verifying the message.
         * 5   The message was verified correctly but an error occurred writing out the signer's certificates.
         * 6   An error occurred writing the output file.
         * 32+ A verify error occurred while -verify_retcode is specified.
         *
         *
         */
    });
});
//# sourceMappingURL=openssl.spec.js.map