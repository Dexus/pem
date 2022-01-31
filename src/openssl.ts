export const name: string = "openssl"
import {spawn as cpspawn} from "child_process"
import crypto from "crypto"
import Error from "error-cause/Error"
import fs from "fs"
import osTmpdir from "os-tmpdir"
import path_lib from "path"
import {env} from "process"
import which from "which"
import {debug} from "./debug"
import * as helper from "./helper"
import {CallbackErrCodeStdoutStderr, CallbackError, CallbackErrStdout} from "./interfaces"
import type {Code, ErrNull, Params, StdOutErr, TempFiles} from "./types"

const settings: any = {}
const tempDir = env.PEMJS_TMPDIR || osTmpdir()

const versionRegEx = new RegExp("^(OpenSSL|LibreSSL) (((\\d+).(\\d+)).(\\d+))([a-z]+)?")

if ("CI" in env && env.CI === "true") {
  if ("LIBRARY" in env && "VERSION" in env && env.LIBRARY != "" && env.VERSION != "") {
    const filePathOpenSSL = `./openssl/${env.LIBRARY}_v${env.VERSION}/bin/openssl`
    if (fs.existsSync(filePathOpenSSL)) {
      env.OPENSSL_BIN = filePathOpenSSL
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
 * @param {string} option name e.g. pathOpenSSL, openSslVersion; TODO rethink nomenclature
 * @param {void} value value
 */
export function setConfig(option: string, value: any): void {
  settings[option] = value
}

/**
 * get configuration setting value
 *
 * @static
 * @param {string} option name
 * @returns {*} result of the setting
 */
export function getConfig(option?: string): any {
  if (option) {
    return settings[option] || undefined
  }
  return settings
}

/**
 * Spawn an openssl command
 *
 * @static
 * @param {CallbackErrStdout} callback Called with (error, stdout-substring)
 * @param {Array<string>} params Array of openssl command line parameters
 * @param {string} searchStr String to use to find data
 * @param {Array<string>} [temp_files] list of temporary files
 */
export function exec(callback: CallbackErrStdout, params: Params, searchStr: string, temp_files?: TempFiles): void {

  spawnWrapper(function (err: ErrNull, code?: Code, stdout?: StdOutErr, stderr?: StdOutErr): void {
    if (err) {
      return callback(err)
    }

    let start, end: number
    let starttest, endtest: (RegExpMatchArray | null)


    if ((starttest = (stdout! as string).match(new RegExp("-+BEGIN " + searchStr + "-+$", "mu"))) && starttest.index !== undefined) {
      start = starttest.index
    } else {
      start = -1
    }

    // To get the full EC key with parameters and private key
    if (searchStr === "EC PARAMETERS") {
      searchStr = "EC PRIVATE KEY"
    }

    if ((endtest = (stdout! as string).match(new RegExp("^\\-+END " + searchStr + "\\-+", "m"))) && endtest.index !== undefined) {
      end = endtest.index + endtest[0].length
    } else {
      end = -1
    }

    if (start >= 0 && end >= 0) {
      return callback(null, (stdout! as string).substring(start, end))
    } else {
      return callback(new Error(searchStr + " not found from openssl output:\n---stdout---\n" + stdout + "\n---stderr---\n" + stderr + "\ncode: " + code))
    }
  }, params, temp_files, false)
}

/**
 *  Spawn an openssl command and get binary output
 *
 * @static
 * @param {CallbackErrStdout} callback Called with (error, stdout)
 * @param {Array<string>} params Array of openssl command line parameters
 * @param {Array<string>} [temp_files] list of temporary files
 */
export function execBinary(callback: CallbackErrStdout, params: Params, temp_files?: TempFiles): void {
  spawnWrapper(function (err: ErrNull, code?: Code, stdout?: StdOutErr, stderr?: StdOutErr) {
    debug("execBinary", {err, code, stdout, stderr})
    if (err) {
      return callback(err)
    }
    return callback(null, stdout)
  }, params, temp_files, true)
}

/**
 * Generically spawn openSSL, without processing the result
 *
 * @static
 * @param {CallbackErrCodeStdoutStderr}     callback Called with (error, exitCode, stdout, stderr)
 * @param {Array<string>}        params   The parameters to pass to openssl
 * @param {boolean}      binary   Output of openssl is binary or text
 */
export function spawn(callback: CallbackErrCodeStdoutStderr, params: Params, binary: boolean): void {
  const pathBin = getConfig("pathOpenSSL") || env.OPENSSL_BIN || "openssl"

  testOpenSSLPath(pathBin, function (err: ErrNull) {
    if (err) {
      return callback(err)
    }
    const openssl = cpspawn(pathBin, (params as Array<string>), {
      timeout: 60000,
      killSignal: "SIGKILL"
    })


    let stderr = (binary ? Buffer.alloc(0) : "")
    let stdout = (binary ? Buffer.alloc(0) : "")
    openssl.stdout.on("data", function (data) {
      if (!binary) {
        stdout += data.toString()
      } else {
        stdout = Buffer.concat([stdout, data])
      }
    })

    openssl.stderr.on("data", function (data) {
      stderr += data.toString()
    })
    // We need both the return code and access to all stdout.  Stdout isn't
    // *really* available until the close event fires; the timing nuance was
    // making this fail periodically.
    let needed = 2 // wait for both exit and close.
    let code: Code = -1
    let finished = false
    const done = function (err?: ErrNull, signal?: any) {
      if (finished) {
        return
      }
      if (signal && signal != null) {
        finished = true
        return callback(signal)
      }
      if (err) {
        finished = true
        return callback(err)
      }

      if (--needed < 1) {
        finished = true
        if (code !== 0) {
          if (code === 2 && (stderr === "" || /depth lookup: unable to/.test((stderr as string)) || /depth lookup: self(-|\s)signed certificate/.test((stderr as string)))) {
            return callback(null, code, stdout, stderr)
          }
          return callback(new Error("Invalid openssl exit code: " + code + "\n% openssl " + params.join(" ") + "\n" + stderr), code)
        } else {
          return callback(null, code, stdout, stderr)
        }
      }
    }

    openssl.on("error", (err1) => {
      if (finished) {
        return
      }

      done(err1)
    })

    openssl.on("exit", function (ret, signal) {
      if (finished) {
        return
      }

      code = ret
      done(undefined, signal)
    })

    openssl.on("close", function () {
      if (finished) {
        return
      }
      stdout = binary ? stdout : stdout.toString("utf-8")
      stderr = stderr.toString("utf-8")
      done()
    })

  })
}

/**
 * @param {Array<string>} params   The parameters to pass to openssl
 * @param {boolean}       binary   Output of openssl is binary or text
 * @returns {Promise<any>} return a Promise of {code, stdout, stderr}
 */
export async function spawn_async(params: Params, binary: boolean): Promise<any> {
  return new Promise((resolve, reject) => {
    spawn((err, code, stdout, stderr) => {
      if (err) {
        return reject(err instanceof Error ? err : new Error(err))
      }
      return resolve({code, stdout, stderr})
    }, params, binary)
  })
}

/**
 * Wrapper for spawn method
 *
 * @static
 * @param {CallbackErrCodeStdoutStderr} callback Called with (error, exitCode, stdout, stderr)
 * @param {Array<string>} params The parameters to pass to openssl
 * @param {Array<string>} [temp_files] list of temporary files
 * @param {boolean} [binary] Output of openssl is binary or text
 */
export function spawnWrapper(callback: CallbackErrCodeStdoutStderr, params: Params, temp_files?: TempFiles, binary?: boolean): void {
  let i
  if (binary === undefined) {
    binary = false
  }

  let files: Array<{ path: string, contents: string | NodeJS.ArrayBufferView }> = []
  let delTempPWFiles: Array<string> = []

  if (temp_files !== undefined) {
    temp_files = ([] as TempFiles).concat(temp_files)
    let f_path
    for (i = 0; i < params.length; i++) {
      if (params[i] === "--TMPFILE--") {
        f_path = path_lib.join(tempDir, crypto.randomBytes(20).toString("hex"))
        files.push({
          path: f_path,
          contents: temp_files.shift() !
        })
        params[i] = f_path
        delTempPWFiles.push(f_path)
      }
    }
  }

  let file
  for (i = 0; i < files.length; i++) {
    file = files[i]
    fs.writeFileSync(file.path, file.contents)
  }

  spawn(function (err: ErrNull, code?: Code, stdout?: StdOutErr, stderr?: StdOutErr) {
    helper.deleteTempFiles(delTempPWFiles, function (fsErr: ErrNull) {
      debug((params[0] as string), {
        err: err,
        fsErr: fsErr,
        code: code !,
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
 * @param {string} pathBin The path to OpenSSL Bin
 * @param {CallbackError} callback Callback function with an error object
 */
function testOpenSSLPath(pathBin: string, callback: CallbackError): void {
  which(pathBin, function (error: ErrNull) {
    if (error) {
      return callback(new Error("Could not find openssl on your system on this path: " + pathBin))
    }
    callback(error)
  })
}

/* Once PEM is imported, the openSslVersion is set with this function. */
spawn(function (err: ErrNull, _code?: Code, stdout?: StdOutErr, stderr?: StdOutErr): void {
  const text = String(stdout) + "\n" + String(stderr) + "\n" + String(err)
  const version = versionRegEx.exec(text)
  if (version === null || version.length <= 7) return
  setConfig("openSslVersion", (version[1]).toUpperCase())
  setConfig("Vendor", (version[1]).toUpperCase())
  setConfig("VendorVersion", version[2])
  setConfig("VendorVersionMajorMinor", version[3])
  setConfig("VendorVersionMajor", version[4])
  setConfig("VendorVersionMinor", version[5])
  setConfig("VendorVersionPatch", version[6])
  setConfig("VendorVersionBuildChar", typeof version[7] === "undefined" ? "" : version[7])
}, ["version"], false)
