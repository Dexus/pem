'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const debug_1 = require("../src/debug");
const openssl = (0, tslib_1.__importStar)(require("../src/openssl"));
const fs = (0, tslib_1.__importStar)(require("fs"));
const process_1 = require("process");
const chai_1 = (0, tslib_1.__importStar)(require("chai"));
const dirty_chai_1 = (0, tslib_1.__importDefault)(require("dirty-chai"));
chai_1.default.use(dirty_chai_1.default);
process_1.env.PEMJS_TMPDIR = path_1.default.resolve('./tmp');
(0, debug_1.debug)("ENVs:", process_1.env);
if ((process_1.env.TRAVIS === 'true' || process_1.env.CI === 'true') && "OPENSSL_DIR" in process_1.env && !("OPENSSL_BIN" in process_1.env)) {
    process_1.env.OPENSSL_BIN = process_1.env.GITHUB_WORKSPACE + '/openssl/bin/openssl';
}
function checkTmpEmpty() {
    (0, chai_1.expect)(fs.readdirSync(process_1.env.PEMJS_TMPDIR)).to.be.empty();
}
function checkError(error, expectError) {
    if (expectError) {
        (0, chai_1.expect)(error).to.be.ok();
        if (expectError !== true) { // object
            Object.keys(expectError).forEach(function (k) {
                (0, chai_1.expect)(error[k]).to.equal(expectError[k]); // code, message, ...
            });
        }
    }
    else {
        (0, chai_1.expect)(error).to.not.be.ok();
    }
}
function checkEcparam(data, min, max) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('ecparam');
    (0, chai_1.expect)(data.ecparam).to.be.a('string');
    (0, chai_1.expect)(/^\r?\n*-----BEGIN EC PARAMETERS-----\r?\n/.test(data.ecparam)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END EC PARAMETERS-----\r?\n/.test(data.ecparam)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----BEGIN EC PRIVATE KEY-----\r?\n/.test(data.ecparam)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END EC PRIVATE KEY-----\r?\n*$/.test(data.ecparam)).to.be.true();
    var matchup = /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/.exec(data.ecparam);
    (0, chai_1.expect)(matchup[0].trim().length).to.be.within(min + 1, max - 1);
}
function checkEcparamNoOut(data, min, max) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('ecparam');
    (0, chai_1.expect)(data.ecparam).to.be.a('string');
    (0, chai_1.expect)(/^\r?\n*-----BEGIN EC PRIVATE KEY-----\r?\n/.test(data.ecparam)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END EC PRIVATE KEY-----\r?\n*$/.test(data.ecparam)).to.be.true();
    var matchup = /-----BEGIN EC PRIVATE KEY-----[\s\S]+-----END EC PRIVATE KEY-----/.exec(data.ecparam);
    (0, chai_1.expect)(matchup[0].trim().length).to.be.within(min + 1, max - 1);
}
function checkDhparam(data, min, max) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('dhparam');
    (0, chai_1.expect)(data.dhparam).to.be.a('string');
    (0, chai_1.expect)(/^\r?\n*-----BEGIN DH PARAMETERS-----\r?\n/.test(data.dhparam)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END DH PARAMETERS-----\r?\n*$/.test(data.dhparam)).to.be.true();
    (0, chai_1.expect)(data.dhparam.trim().length).to.be.within(min + 1, max - 1);
}
function checkPrivateKey(data, min, max, encrypted) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('key');
    (0, chai_1.expect)(data.key).to.be.a('string');
    if (encrypted) {
        (0, chai_1.expect)(/ENCRYPTED(\r?\n|)/.test(data.key)).to.be.true();
    }
    (0, chai_1.expect)(/^\r?\n*-----BEGIN (RSA |ENCRYPTED |)PRIVATE KEY-----\r?\n/.test(data.key)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END (RSA |ENCRYPTED |)PRIVATE KEY-----\r?\n*$/.test(data.key)).to.be.true();
    (0, chai_1.expect)(data.key.trim().length).to.be.within(min + 1, max - 1);
}
function checkCSR(data, expectClientKey) {
    (0, chai_1.expect)(data).to.be.an('object');
    ['clientKey', 'csr'].forEach(function (k) {
        (0, chai_1.expect)(data).to.have.property(k);
        (0, chai_1.expect)(data[k]).to.be.a('string');
    });
    if (expectClientKey) {
        (0, chai_1.expect)(data.clientKey).to.equal(expectClientKey);
    }
    (0, chai_1.expect)(/^\r?\n*-----BEGIN CERTIFICATE REQUEST-----\r?\n/.test(data.csr)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END CERTIFICATE REQUEST-----\r?\n*$/.test(data.csr)).to.be.true();
}
function checkCertificate(data, selfsigned) {
    (0, chai_1.expect)(data).to.be.an('object');
    ['certificate', 'clientKey', 'serviceKey', 'csr'].forEach(function (k) {
        (0, chai_1.expect)(data).to.have.property(k);
        (0, chai_1.expect)(data[k]).to.be.a('string');
    });
    (0, chai_1.expect)(/^\r?\n*-----BEGIN CERTIFICATE-----\r?\n/.test(data.certificate)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END CERTIFICATE-----\r?\n*$/.test(data.certificate)).to.be.true();
    if (selfsigned) {
        (0, chai_1.expect)(data.clientKey).to.equal(data.serviceKey);
    }
    else {
        (0, chai_1.expect)(data.clientKey).to.not.equal(data.serviceKey);
    }
}
function checkCertificateData(data, info) {
    (0, chai_1.expect)(data).to.deep.equal(info);
}
function checkPublicKey(data) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('publicKey');
    (0, chai_1.expect)(data.publicKey).to.be.a('string');
    (0, chai_1.expect)(/^\r?\n*-----BEGIN PUBLIC KEY-----\r?\n/.test(data.publicKey)).to.be.true();
    (0, chai_1.expect)(/\r?\n-----END PUBLIC KEY-----\r?\n*$/.test(data.publicKey)).to.be.true();
}
function checkFingerprint(data) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('fingerprint');
    (0, chai_1.expect)(data.fingerprint).to.be.a('string');
    (0, chai_1.expect)(/^[0-9A-F]{2}(:[0-9A-F]{2}){19}$/.test(data.fingerprint)).to.be.true();
}
function checkModulus(data, encryptAlgorithm) {
    (0, chai_1.expect)(data).to.be.an('object').that.has.property('modulus');
    (0, chai_1.expect)(data.modulus).to.be.a('string');
    switch (encryptAlgorithm) {
        case 'md5':
            (0, chai_1.expect)(/^[a-f0-9]{32}$/i.test(data.modulus)).to.be.true();
            break;
        default:
            (0, chai_1.expect)(/^[0-9A-F]*$/.test(data.modulus)).to.be.true();
            break;
    }
}
module.exports = {
    checkTmpEmpty: checkTmpEmpty,
    checkError: checkError,
    checkDhparam: checkDhparam,
    checkEcparam: checkEcparam,
    checkEcparamNoOut: checkEcparamNoOut,
    checkPrivateKey: checkPrivateKey,
    checkCSR: checkCSR,
    checkCertificate: checkCertificate,
    checkCertificateData: checkCertificateData,
    checkPublicKey: checkPublicKey,
    checkFingerprint: checkFingerprint,
    checkModulus: checkModulus,
    openssl: openssl
};
//# sourceMappingURL=pem.helper.js.map