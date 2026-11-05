'use strict'

var openssl = require('./openssl')
var helper = require('./helper')
var {debug} = require('./debug')
const {getFips} = require('node:crypto')

type ConvertCallback = (error: Error | null, result?: boolean) => void

interface PathBundleIn {
  cert: string
  key?: string
  ca?: string | string[]
}

interface ConvertExports {
  PEM2DER: (pathIN: string, pathOUT: string, type: string | ConvertCallback, callback: ConvertCallback) => void
  DER2PEM: (pathIN: string, pathOUT: string, type: string | ConvertCallback, callback: ConvertCallback) => void
  PEM2P7B: (pathBundleIN: PathBundleIn, pathOUT: string, callback: ConvertCallback) => void
  P7B2PEM: (pathIN: string, pathOUT: string, callback: ConvertCallback) => void
  PEM2PFX: (pathBundleIN: PathBundleIn, pathOUT: string, password: string, callback: ConvertCallback) => void
  PFX2PEM: (pathIN: string, pathOUT: string, password: string, callback: ConvertCallback) => void
  P7B2PFX: (pathBundleIN: PathBundleIn, pathOUT: string, password: string, callback: ConvertCallback) => void
}

// PEM format: .pem, .crt, .cer (!bin), .key
// base64 encoded; the cert file might also include the private key; so key file is optional

// DER format: .der, .cer (bin)
// binary encoded format; cannot include key file

// PKCS#7 / P7B format: .p7b, .p7c
// contains cert and ca chain cert files, but not the key file
// A PKCS7 certificate is serialized using either PEM or DER format.

// PKCS#12 / PFX format: .pfx, .p12
// contains all files: key file, cert and ca chain cert files

/**
 * pem convert module
 *
 * @module convert
 */

var convert: ConvertExports = {} as ConvertExports
module.exports = convert

/**
 * conversion from PEM to DER format
 * if private key is included in PEM encoded file, it won't be included in DER file
 * use this method with type 'rsa' to export private key in that case
 * @param  {String} pathIN  path of the PEM encoded certificate file
 * @param  {String} pathOUT path of the DER encoded certificate file to generate
 * @param  {String} [type] type of file, use 'rsa' for key file, 'x509' otherwise or leave this parameter out
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PEM2DER = function (pathIN: string, pathOUT: string, type: string | ConvertCallback, callback: ConvertCallback) {
  if (!callback && typeof type === 'function') {
    callback = type
    type = 'x509'
  }
  var params = [
    type as string,
    '-outform',
    'der',
    '-in',
    pathIN,
    '-out',
    pathOUT
  ]
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}

/**
 * conversion from DER to PEM format
 * @param  {String} pathIN  path of the DER encoded certificate file
 * @param  {String} pathOUT path of the PEM encoded certificate file to generate
 * @param  {String} [type] type of file, use 'rsa' for key file, 'x509' otherwise or leave this parameter out
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.DER2PEM = function (pathIN: string, pathOUT: string, type: string | ConvertCallback, callback: ConvertCallback) {
  if (!callback && typeof type === 'function') {
    callback = type
    type = 'x509'
  }
  var params = [
    type as string,
    '-inform',
    'der',
    '-in',
    pathIN,
    '-out',
    pathOUT
  ]
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}

/**
 * conversion from PEM to P7B format
 * @param  {Object} pathBundleIN  paths of the PEM encoded certificate files ({cert: '...', ca: '...' or ['...', ...]})
 * @param  {String} pathOUT path of the P7B encoded certificate file to generate
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PEM2P7B = function (pathBundleIN: PathBundleIn, pathOUT: string, callback: ConvertCallback) {
  var params = [
    'crl2pkcs7',
    '-nocrl',
    '-certfile',
    pathBundleIN.cert,
    '-out',
    pathOUT
  ]
  if (pathBundleIN.ca) {
    if (!Array.isArray(pathBundleIN.ca)) {
      pathBundleIN.ca = [pathBundleIN.ca]
    }
    pathBundleIN.ca.forEach(function (ca) {
      params.push('-certfile')
      params.push(ca)
    })
  }
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}

/**
 * conversion from P7B to PEM format
 * @param  {String} pathIN  path of the P7B encoded certificate file
 * @param  {String} pathOUT path of the PEM encoded certificate file to generate
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.P7B2PEM = function (pathIN: string, pathOUT: string, callback: ConvertCallback) {
  var params = [
    'pkcs7',
    '-print_certs',
    '-in',
    pathIN,
    '-out',
    pathOUT
  ]
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    if (error) {
      callback(error)
    } else {
      callback(null, code === 0)
    }
  })
}// TODO: CA also included?

/**
 * conversion from PEM to PFX
 * @param  {Object} pathBundleIN paths of the PEM encoded certificate files ({cert: '...', key: '...', ca: '...' or ['...', ...]})
 * @param  {String} pathOUT path of the PFX encoded certificate file to generate
 * @param  {String} password password to set for accessing the PFX file
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PEM2PFX = function (pathBundleIN: PathBundleIn, pathOUT: string, password: string, callback: ConvertCallback) {
  var params = [
    'pkcs12',
    '-export',
    '-out',
    pathOUT,
    '-inkey',
    pathBundleIN.key as string,
    '-in',
    pathBundleIN.cert
  ]
  // In FIPS mode PKCS12KDF is unavailable, so the MAC must switch to
  // PBMAC1+PBKDF2. The flag exists only since OpenSSL 3.4; passing it to
  // 3.0-3.3 aborts the command ("Unknown option or cipher").
  if (openssl.get('Vendor') === "OPENSSL" && openssl.atLeastVersion(3, 4) && getFips()) {
    params.push('-pbmac1_pbkdf2')
  }
  if (pathBundleIN.ca) {
    if (!Array.isArray(pathBundleIN.ca)) {
      pathBundleIN.ca = [pathBundleIN.ca]
    }
    pathBundleIN.ca.forEach(function (ca) {
      params.push('-certfile')
      params.push(ca)
    })
  }
  var delTempPWFiles: string[] = []
  helper.createPasswordFile({ cipher: '', password: password, passType: 'in' }, params, delTempPWFiles)
  helper.createPasswordFile({ cipher: '', password: password, passType: 'out' }, params, delTempPWFiles)
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    function done (error: Error | null) {
      if (error) {
        callback(error)
      } else {
        callback(null, code === 0)
      }
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(error || fsErr)
    })
  })
}

/**
 * conversion from PFX to PEM
 * @param  {Object} pathIN  path of the PFX encoded certificate file
 * @param  {String} pathOUT path of the PEM encoded certificate file to generate
 * @param  {String} password password to set for accessing the PFX file
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.PFX2PEM = function (pathIN: string, pathOUT: string, password: string, callback: ConvertCallback) {
  var params = [
    'pkcs12',
    '-in',
    pathIN,
    '-out',
    pathOUT,
    '-nodes'
  ]
  // Reading needs no PBMAC1 flag in FIPS mode: the MAC is detected from
  // the input, and the flag only exists since 3.4 anyway.
  var delTempPWFiles: string[] = []
  helper.createPasswordFile({ cipher: '', password: password, passType: 'in' }, params, delTempPWFiles)
  helper.createPasswordFile({ cipher: '', password: password, passType: 'out' }, params, delTempPWFiles)
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    function done (error: Error | null) {
      if (error) {
        callback(error)
      } else {
        callback(null, code === 0)
      }
    }
    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(error || fsErr)
    })
  })
}

/**
 * conversion from P7B to PFX/PKCS#12
 * @param  {Object} pathBundleIN  paths of the PEM encoded certificate files ({cert: '...', key: '...', ca: '...' or ['...', ...]})
 * @param  {String} pathOUT path of the PFX certificate file to generate
 * @param  {String} password password to be set for the PFX file and to be used to access the key file
 * @param  {Function} callback callback method called with error, boolean result
 */
module.exports.P7B2PFX = function (pathBundleIN: PathBundleIn, pathOUT: string, password: string, callback: ConvertCallback) {
  var tmpfile = pathBundleIN.cert.replace(/\.[^.]+$/, '.cer')
  var params = [
    'pkcs7',
    '-print_certs',
    '-in',
    pathBundleIN.cert,
    '-out',
    tmpfile
  ]
  openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
    debug("P7B2PFX", {
      error, code
    })
    if (error) {
      callback(error)
    } else {
      var params = [
        'pkcs12',
        '-export',
        '-in',
        tmpfile,
        '-inkey',
        pathBundleIN.key as string,
        '-out',
        pathOUT
      ]
      // Same PBMAC1 floor as PEM2PFX: the flag exists only since 3.4.
      if (openssl.get('Vendor') === "OPENSSL" && openssl.atLeastVersion(3, 4) && getFips()) {
        params.push('-pbmac1_pbkdf2')
      }
      if (pathBundleIN.ca) {
        if (!Array.isArray(pathBundleIN.ca)) {
          pathBundleIN.ca = [pathBundleIN.ca]
        }
        pathBundleIN.ca.forEach(function (ca) {
          params.push('-certfile')
          params.push(ca)
        })
      }
      var delTempPWFiles = [tmpfile]
      helper.createPasswordFile({ cipher: '', password: password, passType: 'in' }, params, delTempPWFiles)
      helper.createPasswordFile({ cipher: '', password: password, passType: 'out' }, params, delTempPWFiles)
      openssl.spawnWrapper(params, false, function (error: Error | null, code: number | null) {
        function done (error: Error | null) {
          if (error) {
            callback(error)
          } else {
            callback(null, code === 0)
          }
        }
        helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
          done(error || fsErr)
        })
      })
    }
  })
}
