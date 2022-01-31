"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.spawnWrapper = exports.spawn = exports.execBinary = exports.exec = exports.get = exports.set = exports.name = void 0;
const tslib_1 = require("tslib");
exports.name = "openssl";
const helper = (0, tslib_1.__importStar)(require("./helper"));
const debug_1 = require("./debug");
const child_process_1 = require("child_process");
const path_1 = (0, tslib_1.__importDefault)(require("path"));
const fs_1 = (0, tslib_1.__importDefault)(require("fs"));
const os_tmpdir_1 = (0, tslib_1.__importDefault)(require("os-tmpdir"));
const crypto_1 = (0, tslib_1.__importDefault)(require("crypto"));
const which_1 = (0, tslib_1.__importDefault)(require("which"));
const settings = {};
const tempDir = process.env.PEMJS_TMPDIR || (0, os_tmpdir_1.default)();
const versionRegEx = new RegExp('^(OpenSSL|LibreSSL) (((\\d+).(\\d+)).(\\d+))([a-z]+)?');
if ("CI" in process.env && process.env.CI === 'true') {
    if ("LIBRARY" in process.env && "VERSION" in process.env && process.env.LIBRARY != "" && process.env.VERSION != "") {
        const filePathOpenSSL = `./openssl/${process.env.LIBRARY}_v${process.env.VERSION}/bin/openssl`;
        if (fs_1.default.existsSync(filePathOpenSSL)) {
            process.env.OPENSSL_BIN = filePathOpenSSL;
        }
    }
}
/**
 * pem openssl module
 *
 * @module openssl
 */
/**
 * configue this openssl module
 *
 * @static
 * @param {String} option name e.g. pathOpenSSL, openSslVersion; TODO rethink nomenclature
 * @param {*} value value
 */
function set(option, value) {
    settings[option] = value;
}
exports.set = set;
/**
 * get configuration setting value
 *
 * @static
 * @param {String} option name
 */
function get(option) {
    if (option) {
        return settings[option] || undefined;
    }
    return settings;
}
exports.get = get;
function exec(callback, params, searchStr, tmpfiles) {
    spawnWrapper(function (err, code, stdout, stderr) {
        if (err) {
            return callback(err);
        }
        let start, end;
        let starttest, endtest;
        if ((starttest = stdout.match(new RegExp('-+BEGIN ' + searchStr + '-+$', 'mu'))) && starttest.index !== undefined) {
            start = starttest.index;
        }
        else {
            start = -1;
        }
        // To get the full EC key with parameters and private key
        if (searchStr === 'EC PARAMETERS') {
            searchStr = 'EC PRIVATE KEY';
        }
        if ((endtest = stdout.match(new RegExp('^\\-+END ' + searchStr + '\\-+', 'm'))) && endtest.index !== undefined) {
            end = endtest.index + endtest[0].length;
        }
        else {
            end = -1;
        }
        if (start >= 0 && end >= 0) {
            return callback(null, stdout.substring(start, end));
        }
        else {
            return callback(new Error(searchStr + ' not found from openssl output:\n---stdout---\n' + stdout + '\n---stderr---\n' + stderr + '\ncode: ' + code));
        }
    }, params, tmpfiles, false);
}
exports.exec = exec;
function execBinary(callback, params, tmpfiles) {
    spawnWrapper(function (err, code, stdout, stderr) {
        (0, debug_1.debug)("execBinary", { err, code, stdout, stderr });
        if (err) {
            return callback(err);
        }
        return callback(null, stdout);
    }, params, tmpfiles, true);
}
exports.execBinary = execBinary;
/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {CallbackErrCodeStdoutStderr}     callback Called with (error, exitCode, stdout, stderr)
 * @param {Array<string>}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 */
function spawn(callback, params, binary) {
    var pathBin = get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl';
    testOpenSSLPath(pathBin, function (err) {
        if (err) {
            return callback(err);
        }
        var openssl = (0, child_process_1.spawn)(pathBin, params);
        var stderr = (binary ? Buffer.alloc(0) : '');
        var stdout = (binary ? Buffer.alloc(0) : '');
        openssl.stdout.on('data', function (data) {
            if (!binary) {
                stdout += data.toString('binary');
            }
            else {
                stdout = Buffer.concat([stdout, data]);
            }
        });
        openssl.stderr.on('data', function (data) {
            stderr += data.toString('binary');
        });
        // We need both the return code and access to all of stdout.  Stdout isn't
        // *really* available until the close event fires; the timing nuance was
        // making this fail periodically.
        var needed = 2; // wait for both exit and close.
        var code = -1;
        var finished = false;
        var done = function (err) {
            if (finished) {
                return;
            }
            if (err) {
                finished = true;
                return callback(err);
            }
            if (--needed < 1) {
                finished = true;
                if (code !== 0) {
                    if (code === 2 && (stderr === '' || /depth lookup: unable to/.test(stderr) || /depth lookup: self(-|\s)signed certificate/.test(stderr))) {
                        return callback(null, code, stdout, stderr);
                    }
                    return callback(new Error('Invalid openssl exit code: ' + code + '\n% openssl ' + params.join(' ') + '\n' + stderr), code);
                }
                else {
                    return callback(null, code, stdout, stderr);
                }
            }
        };
        openssl.on('error', done);
        openssl.on('exit', function (ret) {
            code = ret;
            done();
        });
        openssl.on('close', function () {
            stdout = binary ? stdout : stdout.toString('utf-8');
            stderr = stderr.toString('utf-8');
            done();
        });
    });
}
exports.spawn = spawn;
/**
 * Wrapper for spawn method
 *
 * @static
 * @param {CallbackErrCodeStdoutStderr} callback Called with (error, exitCode, stdout, stderr)
 * @param {Array<string>} params The parameters to pass to openssl
 * @param {Array<string>} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 */
function spawnWrapper(callback, params, tmpfiles, binary) {
    if (binary === undefined) {
        binary = false;
    }
    var files = [];
    var delTempPWFiles = [];
    if (tmpfiles !== undefined) {
        tmpfiles = [].concat(tmpfiles);
        var fpath, i;
        for (i = 0; i < params.length; i++) {
            if (params[i] === '--TMPFILE--') {
                fpath = path_1.default.join(tempDir, crypto_1.default.randomBytes(20).toString('hex'));
                files.push({
                    path: fpath,
                    contents: tmpfiles.shift()
                });
                params[i] = fpath;
                delTempPWFiles.push(fpath);
            }
        }
    }
    var file;
    for (i = 0; i < files.length; i++) {
        file = files[i];
        fs_1.default.writeFileSync(file.path, file.contents);
    }
    spawn(function (err, code, stdout, stderr) {
        helper.deleteTempFiles(delTempPWFiles, function (fsErr) {
            (0, debug_1.debug)(params[0], {
                err: err,
                fsErr: fsErr,
                code: code,
                stdout: stdout,
                stderr: stderr
            });
            callback(err || fsErr, code, stdout, stderr);
        });
    }, params, binary);
}
exports.spawnWrapper = spawnWrapper;
/**
 * Validates the pathBin for the openssl command
 *
 * @private
 * @param {String} pathBin The path to OpenSSL Bin
 * @param {Function} callback Callback function with an error object
 */
function testOpenSSLPath(pathBin, callback) {
    (0, which_1.default)(pathBin, function (error) {
        if (error) {
            return callback(new Error('Could not find openssl on your system on this path: ' + pathBin));
        }
        callback(error);
    });
}
/* Once PEM is imported, the openSslVersion is set with this function. */
spawn(function (err, _code, stdout, stderr) {
    var text = String(stdout) + '\n' + String(stderr) + '\n' + String(err);
    let version = versionRegEx.exec(text);
    if (version === null || version.length <= 7)
        return;
    set('openSslVersion', (version[1]).toUpperCase());
    set('Vendor', (version[1]).toUpperCase());
    set('VendorVersion', version[2]);
    set('VendorVersionMajorMinor', version[3]);
    set('VendorVersionMajor', version[4]);
    set('VendorVersionMinor', version[5]);
    set('VendorVersionPatch', version[6]);
    set('VendorVersionBuildChar', typeof version[7] === 'undefined' ? '' : version[7]);
}, ['version'], false);
//# sourceMappingURL=openssl.js.map
