'use strict'

import pathlib = require('path')
import fs = require('fs')
import crypto = require('crypto')
const {tmpdir} = require('os')
var tempDir = process.env.PEMJS_TMPDIR || tmpdir()

interface CreatePasswordFileOptions { cipher?: string; password?: string; passType?: string; mustPass?: boolean }

/**
 * pem helper module
 *
 * @module helper
 */

var helper = {} as {
  isNumber: (str: any) => boolean
  isHex: (hex: any) => boolean
  toHex: (str: string) => string
  ciphers: string[]
  createPasswordFile: (options: CreatePasswordFileOptions, params: string[], PasswordFileArray: string[]) => boolean
  deleteTempFiles: (files: string | string[], callback: (err: NodeJS.ErrnoException | null) => void) => void
}

/**
 * helper function to check is the string a number or not
 * @param {String} str String that should be checked to be a number
 */
helper.isNumber = function (str: any) {
  if (Array.isArray(str)) {
    return false
  }
  /*
  var bstr = str && str.toString()
  str = str + ''

  return bstr - parseFloat(bstr) + 1 >= 0 &&
          !/^\s+|\s+$/g.test(str) && /^\d+$/g.test(str) &&
          !isNaN(str) && !isNaN(parseFloat(str))
  */
  return /^\d+$/g.test(str)
}

/**
 * helper function to check is the string a hexaceximal value
 * @param {String} hex String that should be checked to be a hexaceximal
 */
helper.isHex = function isHex (hex: any) {
  return /^(0x){0,1}([0-9A-F]{1,40}|[0-9A-F]{1,40})$/gi.test(hex)
}

/**
 * helper function to convert a string to a hexaceximal value
 * @param {String} str String that should be converted to a hexaceximal
 */
helper.toHex = function toHex (str: string) {
  var hex = ''
  for (var i = 0; i < str.length; i++) {
    hex += '' + str.charCodeAt(i).toString(16)
  }
  return hex
}

// cipherPassword returns an array of supported ciphers.
/**
 * list of supported ciphers
 * @type {Array}
 */
helper.ciphers = ['aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea']
var ciphers: string[] = helper.ciphers

/**
 * Creates a PasswordFile to hide the password form process infos via `ps auxf` etc.
 * @param {Object} options object of cipher, password and passType, mustPass, {cipher:'aes128', password:'xxxx', passType:"in/out/word"}, if the object empty we do nothing
 * @param {String} options.cipher cipher like 'aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea'
 * @param {String} options.password password can be empty or at last 4 to 1023 chars
 * @param {String} options.passType passType: can be in/out/word for passIN/passOUT/passWORD
 * @param {Boolean} options.mustPass mustPass is used when you need to set the pass like as "-password pass:" most needed when empty password
 * @param {Object} params params will be extended with the data that need for the openssl command. IS USED AS POINTER!
 * @param {String} PasswordFileArray PasswordFileArray is an array of filePaths that later need to deleted ,after the openssl command. IS USED AS POINTER!
 * @return {Boolean} result
 */
helper.createPasswordFile = function (options: CreatePasswordFileOptions, params: string[], PasswordFileArray: string[]): boolean {
  if (!options || !Object.prototype.hasOwnProperty.call(options, 'password') || !(typeof options.password === 'string') || !Object.prototype.hasOwnProperty.call(options, 'passType') || !/^(word|in|out)$/.test(options.passType as string)) {
    return false
  }
  var PasswordFile = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
  PasswordFileArray.push(PasswordFile)
  options.password = options.password.trim()
  if (options.password === '') {
    options.mustPass = true
  }
  if (options.cipher && (ciphers.indexOf(options.cipher) !== -1)) {
    params.push('-' + options.cipher)
  }
  params.push('-pass' + (params[0] !== 'genpkey' ? (options.passType as string) : ''))
  if (options.mustPass) {
    params.push('pass:' + options.password)
  } else {
    // the password file holds a secret: never readable by other local
    // users, regardless of the process umask.
    fs.writeFileSync(PasswordFile, options.password, { mode: 0o600 })
    params.push('file:' + PasswordFile)
  }
  return true
}

/**
 * Deletes a file or an array of files
 * @param {Array} files array of files that shoudld be deleted
 * @param {errorCallback} callback Callback function with an error object
 */
helper.deleteTempFiles = function (files: string | string[], callback: (err: NodeJS.ErrnoException | null) => void) {
  var rmFiles: string[] = []
  if (typeof files === 'string') {
    rmFiles.push(files)
  } else if (Array.isArray(files)) {
    rmFiles = files
  } else {
    return callback(new Error('Unexcepted files parameter type; only string or array supported'))
  }
  var deleteSeries = function (list: string[], finalCallback: (err: NodeJS.ErrnoException | null) => void): void {
    if (list.length) {
      var file = list.shift()
      var myCallback = function (err: NodeJS.ErrnoException | null) {
        if (err && err.code === 'ENOENT') {
          // file doens't exist
          return deleteSeries(list, finalCallback)
        } else if (err) {
          // other errors, e.g. maybe we don't have enough permission
          return finalCallback(err)
        } else {
          return deleteSeries(list, finalCallback)
        }
      }
      if (file && typeof file === 'string') {
        fs.unlink(file, myCallback)
      } else {
        return deleteSeries(list, finalCallback)
      }
    } else {
      return finalCallback(null) // no errors
    }
  }
  deleteSeries(rmFiles, callback)
}

export = helper
/**
 * Callback for return an error object.
 * @callback errorCallback
 * @param {Error} err - An Error Object or null
 */
