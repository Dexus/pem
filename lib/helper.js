'use strict'

var pathlib = require('path')
var fs = require('fs')
var crypto = require('crypto')
var osTmpdir = require('os-tmpdir')
var tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

var ciphers = ['aes128', 'aes192', 'aes256', 'camellia128', 'camellia192', 'camellia256', 'des', 'des3', 'idea']
// cipherPassword returns an array of supported ciphers.
module.exports.ciphers = ciphers

/**
 * pem helper library interface
 *
 * @interface helper
 */

/**
 * Creates a PasswordFile to hide the password form process infos via `ps auxf` etc.
 *
 * @name helper#helperCreatePasswordFile
 * @param {Object} [options] object of cipher, password and passType {cipher:'aes128', password:'xxxx', passType:"in/out/word"}, if the object empty we do nothing
 * @param {Object} params params will be extended with the data that need for the openssl command. IS USED AS POINTER!
 * @param {String} PasswordFile PasswordFile is the filePath that later need to deleted, after the openssl command. IS USED AS POINTER!
 */
module.exports.helperCreatePasswordFile = function (options, params, PasswordFile) {
  if (Object.keys(options).length < 3) {
    return false
  }
  if (!(options.password && options.passType)) {
    return false
  }
  //  if (!options.passType && options.passType.trim().length === 0) { // NOTE: ' ' is falsy and thus covered by !options.passType and thus by 2nd condition too
  //  return false
  // }
  PasswordFile = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
  fs.writeFileSync(PasswordFile, options.password)
  if (options.cipher && (Number(ciphers.indexOf(options.cipher)) !== -1)) {
    params.push('-' + options.cipher)
  }
  params.push('-pass' + (options.passType && options.passType.trim() === 'word' ? 'word' : (options.passType && options.passType.trim() === 'out' ? 'out' : 'in')))
  if (options && options.mustPass === 'password') {
    params.push('pass:' + options.password)
  } else {
    params.push('file:' + PasswordFile)
  }
  return true
}

/**
 * Deletes a file or an array of files
 *
 * @name helper#helperDeleteTempFiles
 * @param {Array} files array of files that shoudld be deleted
 * @param {Function} callback Callback function with an error object
 */
module.exports.helperDeleteTempFiles = function (files, callback) {
  var rmFiles = []
  if (typeof files === 'string') {
    rmFiles.push(files)
  } else if (Array.isArray(files)) {
    rmFiles = files
  } else {
    return callback(new Error('Unexcepted files parameter type; only string or array supported'))
  }
  var deleteSeries = function (list, finalCallback) {
    if (list.length) {
      var file = list.shift()
      var myCallback = function (err) {
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
