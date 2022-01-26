export const name: string = "openssl"
import * as helper from './helper'
import {Func4WithError} from './interfaces'
import {debug} from './debug'
import {spawn as cpspawn} from 'child_process'
import * as pathlib from 'path'
import fs from 'fs'
import osTmpdir from 'os-tmpdir'
import crypto from 'crypto'
import which from 'which'

export const settings: any = {}
const tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

const versionRegEx = new RegExp('^(OpenSSL|LibreSSL) (((\\d+).(\\d+)).(\\d+))([a-z]+)?')

if ("CI" in process.env && process.env.CI === 'true') {
    if ("LIBRARY" in process.env && "VERSION" in process.env && process.env.LIBRARY != "" && process.env.VERSION != "") {
        const filePathOpenSSL = `./openssl/${process.env.LIBRARY}_v${process.env.VERSION}/bin/openssl`
        if (fs.existsSync(filePathOpenSSL)) {
            process.env.OPENSSL_BIN = filePathOpenSSL
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
export function set(option: string, value: any) {
    settings[option] = value
}

/**
 * get configuration setting value
 *
 * @static
 * @param {String} option name
 */
export function get(option: string) {
    return settings[option] || undefined
}

/**
 * Spawn an openssl command
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout-substring)
 */
export function exec(callback: Func4WithError, params: string[], searchStr: string): void;
export function exec(callback: Func4WithError, params: string[], searchStr: string, tmpfiles?: string[]): void {

    spawnWrapper(function (err: Error|null, code?: number, stdout?: string|NodeJS.ArrayBufferView, stderr?: string|NodeJS.ArrayBufferView): void {
        if (err) {
            return callback(err)
        }

        let start, end: number
        let starttest, endtest: (RegExpMatchArray | null)


        if ((starttest = (stdout! as string).match(new RegExp('-+BEGIN ' + searchStr + '-+$', 'mu'))) && starttest.index !== undefined) {
            start = starttest.index
        } else {
            start = -1
        }

        // To get the full EC key with parameters and private key
        if (searchStr === 'EC PARAMETERS') {
            searchStr = 'EC PRIVATE KEY'
        }

        if ((endtest = (stdout! as string).match(new RegExp('^\\-+END ' + searchStr + '\\-+', 'm'))) && endtest.index !== undefined) {
            end = endtest.index + endtest[0].length
        } else {
            end = -1
        }

        if (start >= 0 && end >= 0) {
            return callback(null, (stdout! as string).substring(start, end))
        } else {
            return callback(new Error(searchStr + ' not found from openssl output:\n---stdout---\n' + stdout + '\n---stderr---\n' + stderr + '\ncode: ' + code))
        }
    }, params, tmpfiles, false)
}

/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {Array} params Array of openssl command line parameters
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout)
 */
export function execBinary(callback: Function, params: string[]): void
export function execBinary(callback: Function, params: string[], tmpfiles?: string[]): void {
    spawnWrapper(function (err: Error, code: number, stdout: string, stderr: string) {
        debug("execBinary", {err, code, stdout, stderr})
        if (err) {
            return callback(err)
        }
        return callback(null, stdout)
    }, params, tmpfiles, true)
}

/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 * @param {Array}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 */
export function spawn(callback: Function, params: string[], binary: boolean): void {
    var pathBin = get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'

    testOpenSSLPath(pathBin, function (err: Error) {
        if (err) {
            return callback(err)
        }
        var openssl = cpspawn(pathBin, params)

        var stderr = (binary ? Buffer.alloc(0) : '')
        var stdout = (binary ? Buffer.alloc(0) : '')
        openssl.stdout.on('data', function (data) {
            if (!binary) {
                stdout += data.toString('binary')
            } else {
                stdout = Buffer.concat([stdout, data])
            }
        })

        openssl.stderr.on('data', function (data) {
            stderr += data.toString('binary')
        })
        // We need both the return code and access to all of stdout.  Stdout isn't
        // *really* available until the close event fires; the timing nuance was
        // making this fail periodically.
        var needed = 2 // wait for both exit and close.
        var code: number|null = -1
        var finished = false
        var done = function (err?:Error) {
            if (finished) {
                return
            }

            if (err) {
                finished = true
                return callback(err)
            }

            if (--needed < 1) {
                finished = true
                if (code !== 0) {
                    if (code === 2 && (stderr === '' || /depth lookup: unable to/.test((stderr as string)) || /depth lookup: self(-|\s)signed certificate/.test((stderr as string)))) {
                        return callback(null, code, stdout, stderr)
                    }
                    return callback(new Error('Invalid openssl exit code: ' + code + '\n% openssl ' + params.join(' ') + '\n' + stderr), code)
                } else {
                    return callback(null, code, stdout, stderr)
                }
            }
        }

        openssl.on('error', done)

        openssl.on('exit', function (ret) {
            code = ret
            done()
        })

        openssl.on('close', function () {
            stdout = binary ? stdout : stdout.toString('utf-8')
            stderr = stderr.toString('utf-8')
            done()
        })
    })
}

/**
 * Wrapper for spawn method
 *
 * @static
 * @param {Function} callback Called with (error, exitCode, stdout, stderr)
 * @param {Array} params The parameters to pass to openssl
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Boolean} [binary] Output of openssl is binary or text
 */
export function spawnWrapper(callback: Function, params: string[], tmpfiles?: Array<string | NodeJS.ArrayBufferView>, binary?: boolean): void {
    if (binary === undefined){
        binary= false
    }

    var files: Array<{ path: string, contents: string | NodeJS.ArrayBufferView }> = []
    var delTempPWFiles: Array<string> = []

    if (tmpfiles !== undefined) {
        tmpfiles = ([] as Array<string | NodeJS.ArrayBufferView>).concat(tmpfiles)
        var fpath, i
        for (i = 0; i < params.length; i++) {
            if (params[i] === '--TMPFILE--') {
                fpath = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
                files.push({
                    path: fpath,
                    contents: tmpfiles.shift() !
                })
                params[i] = fpath
                delTempPWFiles.push(fpath)
            }
        }
    }

    var file
    for (i = 0; i < files.length; i++) {
        file = files[i]
        fs.writeFileSync(file.path, file.contents)
    }

    spawn(function (err: Error, code: number, stdout: string, stderr: string) {
        helper.deleteTempFiles(delTempPWFiles, function (fsErr:Error) {
            debug(params[0], {
                err: err,
                fsErr: fsErr,
                code: code,
                stdout: stdout,
                stderr: stderr
            })
            callback(err || fsErr, code, stdout, stderr)
        })
    }, params, binary)
}

/**
 * Validates the pathBin for the openssl command
 *
 * @private
 * @param {String} pathBin The path to OpenSSL Bin
 * @param {Function} callback Callback function with an error object
 */
function testOpenSSLPath(pathBin: string, callback: Function): void {
    which(pathBin, function (error) {
        if (error) {
            return callback(new Error('Could not find openssl on your system on this path: ' + pathBin))
        }
        callback()
    })
}

/* Once PEM is imported, the openSslVersion is set with this function. */
spawn(function (err: Error, code: number, stdout: string, stderr: string): void {
    var text = String(stdout) + '\n' + String(stderr) + '\n' + String(err)
    let version = versionRegEx.exec(text)
    if (version === null || version.length <= 7) return
    set('openSslVersion', (version[1]).toUpperCase())
    set('Vendor', (version[1]).toUpperCase())
    set('VendorVersion', version[2])
    set('VendorVersionMajorMinor', version[3])
    set('VendorVersionMajor', version[4])
    set('VendorVersionMinor', version[5])
    set('VendorVersionPatch', version[6])
    set('VendorVersionBuildChar', typeof version[7] === 'undefined' ? '' : version[7])
}, ['version'], false)
