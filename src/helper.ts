export const name: string = "helper"

import {CallbackError} from "./interfaces"
import type {Cipher, Hash} from "./types"
import {ciphers} from "./types"

const path_lib = require("path")
const fs = require("fs")
const crypto = require("crypto")
const osTmpdir = require("os-tmpdir")
const tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _hash: Hash = "md5"
let _hash2: Hash = "md5"
_hash = "md5" || _hash2
_hash2 = _hash

/**
 * pem helper module
 *
 * @module helper
 */

/**
 * helper function to check is the string a number or not
 *
 * @param {string} str String that should be checked to be a number
 * @returns {boolean} result
 */
export function isNumber(str: any) {
  if (Array.isArray(str)) {
    return false
  }
  /*
  ``
  var bstr = str && str.toString()
  str = str + ''

  return bstr - parseFloat(bstr) + 1 >= 0 &&
          !/^\s+|\s+$/g.test(str) && /^\d+$/g.test(str) &&
          !isNaN(str) && !isNaN(parseFloat(str))
  ```
  */
  return /^\d+$/g.test(str)
}

/**
 * helper function to check is the string a hexadecimal value
 *
 * @param {string} hex String that should be checked to be a hexadecimal
 * @returns {boolean} result
 */
export function isHex(hex: string) {
  return /^(0x)?([0-9A-F]{1,40})$/gi.test(hex)
}

/**
 * helper function to convert a string to a hexadecimal value
 *
 * @param {string} str String that should be converted to a hexadecimal
 * @returns {string} hexadecimal string
 */
export function toHex(str: string) {
  let hex = ""
  for (let i = 0; i < str.length; i++) {
    hex += "" + str.charCodeAt(i).toString(16)
  }
  return hex
}

/**
 * Creates a PasswordFile to hide the password form process infos via `ps auxf` etc.
 *
 * @param {Object} options object of cipher, password and passType, mustPass, {cipher:'aes128', password:'xxxx', passType:"in/out/word"}, if the object empty we do nothing
 * @param {Cipher} options.cipher cipher like 'aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea'
 * @param {string} options.password password can be empty or at last 4 to 1023 chars
 * @param {string} options.passType passType: can be in/out/word for passIN/passOUT/passWORD
 * @param {boolean} options.mustPass mustPass is used when you need to set the pass like as "-password pass:" most needed when empty password
 * @param {Array<string>} params params will be extended with the data that need for the openssl command. IS USED AS POINTER!
 * @param {Array<string>} PasswordFileArray PasswordFileArray is an array of filePaths that later need to deleted ,after the openssl command. IS USED AS POINTER!
 * @returns {boolean} result
 */
export function createPasswordFile(options: {
  cipher: Cipher,
  password: string,
  passType: string,
  mustPass: boolean,
}, params: string[], PasswordFileArray: string[]): boolean {
  if (!options || !Object.prototype.hasOwnProperty.call(options, "password") || !Object.prototype.hasOwnProperty.call(options, "passType") || !/^(word|in|out)$/.test(options.passType)) {
    return false
  }
  let PasswordFile = path_lib.join(tempDir, crypto.randomBytes(20).toString("hex"))
  PasswordFileArray.push(PasswordFile)
  options.password = options.password.trim()
  if (options.password === "") {
    options.mustPass = true
  }
  if (options.cipher && (ciphers.indexOf(options.cipher) !== -1)) {
    params.push("-" + options.cipher)
  }
  params.push("-pass" + options.passType)
  if (options.mustPass) {
    params.push("pass:" + options.password)
  } else {
    fs.writeFileSync(PasswordFile, options.password)
    params.push("file:" + PasswordFile)
  }
  return true
}

/**
 * Deletes a file or an array of files
 *
 * @param {Array} files array of files that should be deleted
 * @param {errorCallback} errorCallback Callback function with an error object
 * @returns {void}
 */
export function deleteTempFiles(files: string[], errorCallback: CallbackError): void {
  let rmFiles: string[] = []
  if (Array.isArray(files)) {
    rmFiles = files
  } else {
    return errorCallback(new Error("Unexpected files parameter type; only string or array supported"))
  }
  let deleteSeries = function (list: string[], finalCallback: Function): void {
    if (list.length) {
      let file = list.shift()
      let myCallback = function (err: Error) {
        console.log(err.constructor.name)
        if (isError(err) && err.code === "ENOENT") {
          // file doesn't exist
          return deleteSeries(list, finalCallback)
        } else if (err) {
          // other errors, e.g. maybe we don't have enough permission
          return finalCallback(err)
        } else {
          return deleteSeries(list, finalCallback)
        }
      }
      if (file) {
        fs.unlink(file, myCallback)
      } else {
        return deleteSeries(list, finalCallback)
      }
    } else {
      return finalCallback(null) // no errors
    }
  }
  deleteSeries(rmFiles, errorCallback)
}

/**
 * @param {Error} error the error object.
 * @returns {boolean} if given error object is a NodeJS error.
 */
export function isError(error: Error): error is NodeJS.ErrnoException {
  return (error instanceof Error)
}

