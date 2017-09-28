var Buffer = require('safe-buffer').Buffer
var helper = require('./helper.js')
var spawn = require('child_process').spawn
var pathlib = require('path')
var fs = require('fs')
var osTmpdir = require('os-tmpdir')
var crypto = require('crypto')
var which = require('which')
var settings = {}
var tempDir = process.env.PEMJS_TMPDIR || osTmpdir()

/**
 * configue this openssl module
 * @param {String} option name e.g. pathOpenSSL, openSslVersion; TODO rethink nomenclature
 * @param {*} value value
 */
function set (option, value) {
  settings[option] = value
}

/**
 * get configuration setting value
 * @param {String} option name
 */
function get (option) {
  return settings[option] || null
}

/**
 * Spawn an openssl command
 * @param {Array} params Array of openssl command line parameters
 * @param {String} searchStr String to use to find data
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout-substring)
 */
function execOpenSSL (params, searchStr, tmpfiles, callback) {
  if (!callback && typeof tmpfiles === 'function') {
    callback = tmpfiles
    tmpfiles = false
  }

  spawnWrapper(params, tmpfiles, function (err, code, stdout, stderr) {
    var start, end

    if (err) {
      return callback(err)
    }

    if ((start = stdout.match(new RegExp('\\-+BEGIN ' + searchStr + '\\-+$', 'm')))) {
      start = start.index
    } else {
      start = -1
    }

    // To get the full EC key with parameters and private key
    if (searchStr === 'EC PARAMETERS') {
      searchStr = 'EC PRIVATE KEY'
    }

    if ((end = stdout.match(new RegExp('^\\-+END ' + searchStr + '\\-+', 'm')))) {
      end = end.index + (end[0] || '').length
    } else {
      end = -1
    }

    if (start >= 0 && end >= 0) {
      return callback(null, stdout.substring(start, end))
    } else {
      return callback(new Error(searchStr + ' not found from openssl output:\n---stdout---\n' + stdout + '\n---stderr---\n' + stderr + '\ncode: ' + code))
    }
  })
}

/**
 *  Spawn an openssl command and get binary output
 * @param {Array} params Array of openssl command line parameters
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Function} callback Called with (error, stdout)
*/
function execBinaryOpenSSL (params, tmpfiles, callback) {
  if (!callback && typeof tmpfiles === 'function') {
    callback = tmpfiles
    tmpfiles = false
  }
  spawnWrapper(params, tmpfiles, true, function (err, code, stdout, stderr) {
    if (err) {
      return callback(err)
    }
    return callback(null, stdout)
  })
}

/**
 * Generically spawn openSSL, without processing the result
 * @param {Array}        params   The parameters to pass to openssl
 * @param {Boolean}      binary   Output of openssl is binary or text
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 */
function spawnOpenSSL (params, binary, callback) {
  var pathBin = get('pathOpenSSL') || process.env.OPENSSL_BIN || 'openssl'

  testOpenSSLPath(pathBin, function (err) {
    if (err) {
      return callback(err)
    }
    var openssl = spawn(pathBin, params)
    var stderr = ''

    var stdout = (binary ? new Buffer(0) : '')
    openssl.stdout.on('data', function (data) {
      if (!binary) {
        stdout += (data || '').toString('binary')
      } else {
        stdout = Buffer.concat([stdout, data])
      }
    })

    openssl.stderr.on('data', function (data) {
      stderr += (data || '').toString('binary')
    })
    // We need both the return code and access to all of stdout.  Stdout isn't
    // *really* available until the close event fires; the timing nuance was
    // making this fail periodically.
    var needed = 2 // wait for both exit and close.
    var code = -1
    var finished = false
    var done = function (err) {
      if (finished) {
        return
      }

      if (err) {
        finished = true
        return callback(err)
      }

      if (--needed < 1) {
        finished = true
        if (code) {
          if (code === 2 && stderr === '') {
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
      stdout = (binary ? stdout : new Buffer(stdout, 'binary').toString('utf-8'))
      stderr = new Buffer(stderr, 'binary').toString('utf-8')
      done()
    })
  })
}

/**
 * Wrapper for spawn method
 * @param {Array} params The parameters to pass to openssl
 * @param {Array} [tmpfiles] list of temporary files
 * @param {Boolean} binary Output of openssl is binary or text
 * @param {Function} callback Called with (error, exitCode, stdout, stderr)
 */
function spawnWrapper (params, tmpfiles, binary, callback) {
  if (!callback && typeof binary === 'function') {
    callback = binary
    binary = false
  }

  var files = []
  var delTempPWFiles = []

  if (tmpfiles) {
    tmpfiles = [].concat(tmpfiles || [])
    params.forEach(function (value, i) {
      var fpath
      if (value === '--TMPFILE--') {
        fpath = pathlib.join(tempDir, crypto.randomBytes(20).toString('hex'))
        files.push({
          path: fpath,
          contents: tmpfiles.shift()
        })
        params[i] = fpath
        delTempPWFiles[delTempPWFiles.length] = fpath
      }
    })
  }

  // TODO: need to refactored
  files.forEach(function (file) {
    fs.writeFileSync(file.path, file.contents)
  })

  spawnOpenSSL(params, binary, function (err, code, stdout, stderr) {
    helper.helperDeleteTempFiles(delTempPWFiles, function (fsErr) {
      callback(err || fsErr, code, stdout, stderr)
    })
  })
}

/**
 * Validates the pathBin for the openssl command
 * @param {String} pathBin The path to OpenSSL Bin
 * @param {Function} callback Callback function with an error object
 */
function testOpenSSLPath (pathBin, callback) {
  which(pathBin, function (error) {
    if (error) {
      return callback(new Error('Could not find openssl on your system on this path: ' + pathBin))
    }

    callback()
  })
}

/* Once PEM is imported, the openSslVersion is set with this function. */
spawnOpenSSL(['version'], false, function (err, code, stdout, stderr) {
  var text = String(stdout) + '\n' + String(stderr) + '\n' + String(err)
  var tmp = text.match(/^LibreSSL/i)
  set('openSslVersion', (tmp && tmp[0] ? 'LibreSSL' : 'openssl').toUpperCase())
})

module.exports = {
  exec: execOpenSSL,
  execBinary: execBinaryOpenSSL,
  spawn: spawnOpenSSL,
  spawnWrapper: spawnWrapper,
  set: set,
  get: get
}
