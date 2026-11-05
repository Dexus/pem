'use strict'

type PrivateKeyCallback = (err?: Error | string | null, result?: { key: string }) => void
type DhparamCallback = (err?: Error | string | null, result?: { dhparam: string }) => void
type EcparamCallback = (err?: Error | string | null, result?: { ecparam: string }) => void
type CSRCallback = (err?: Error | string | null, result?: { csr: string; clientKey: string; config: string | null }) => void
type CertificateCallback = (err?: Error | string | null, result?: { certificate: string; csr: string; clientKey: string; serviceKey: string }) => void
type ReadCertificateInfoCallback = (err?: Error | string | null, data?: CertificateInfoValues) => void
type GetPublicKeyCallback = (err?: Error | string | null, result?: { publicKey: string }) => void
type GetFingerprintCallback = (err?: Error | string | null, result?: { fingerprint: string }) => void
type GetModulusCallback = (err?: Error | string | null, result?: { modulus: string }) => void
type GetDhparamInfoCallback = (err?: Error | string | null, result?: { size?: number; group?: string; prime?: string }) => void
type CreatePkcs12Callback = (err?: Error | string | null, result?: { pkcs12: Buffer }) => void
type ReadPkcs12Callback = (err?: Error | string | null, bundle?: { cert?: string; ca?: string[]; key?: string }) => void
type VerifySigningChainCallback = (err?: Error | string | null, valid?: boolean | string) => void
type CheckCertificateCallback = (err?: Error | string | null, valid?: boolean) => void
type CheckPkcs12Callback = (err?: Error | string | null, valid?: boolean) => void
type CreatePkcs8Callback = (err?: Error | string | null, result?: { pkcs8: string | Buffer }) => void

interface CreatePrivateKeyOptions {
  cipher?: string
  password?: string
}

interface CreateCSROptions {
  clientKey?: string
  clientKeyPassword?: string
  keyBitsize?: number
  hash?: string
  country?: string
  state?: string
  locality?: string
  organization?: string | string[]
  organizationUnit?: string | string[]
  commonName?: string
  altNames?: string[]
  emailAddress?: string
  csrConfigFile?: string
  config?: string | null
  password?: string
  dc?: string | string[]
  DC?: string | string[]
  C?: string
  ST?: string
  L?: string
  O?: string | string[]
  OU?: string | string[]
  CN?: string
  CA?: boolean
}

interface CreateCertificateOptions extends CreateCSROptions {
  csr?: string
  serviceCertificate?: string
  serviceKey?: string
  serviceKeyPassword?: string
  selfSigned?: boolean
  serial?: string | number | Buffer
  serialFile?: string
  days?: number
  extFile?: string
  cipher?: string
  copyExtensions?: boolean
}

interface CreatePkcs12Options {
  cipher?: string
  clientKeyPassword?: string
  certFiles?: string[]
  certpbe?: string
  keypbe?: string
  macalg?: string
}

interface ReadPkcs12Options {
  p12Password?: string
  clientKeyPassword?: string
}

interface CreatePkcs8Options {
  cipher?: string
  password?: string
  clientKeyPassword?: string
  outform?: 'PEM' | 'DER'
}

// widened honestly from what fetchCertificateData actually stores (SAN fields
// carry string[] or '', dynamic subject keys carry string|string[]) — the
// public types/pem.d.ts stays untouched
interface CertificateInfoValues {
  issuer: { [key: string]: any }
  [key: string]: any
}

/**
 * pem module
 *
 * @module pem
 */
const {debug} = require('./debug')
const {createHash, getFips} = require('node:crypto')
var net = require('net')
var helper = require('./helper')
var openssl = require('./openssl')
const hash_md5 = (value: string | Buffer) => {
  if (Buffer.isBuffer(value)) {
    return createHash('md5').update(value).digest('hex')
  }
  return createHash('md5').update(String(value), 'utf8').digest('hex')
}

module.exports.createPrivateKey = createPrivateKey
module.exports.createDhparam = createDhparam
module.exports.createEcparam = createEcparam
module.exports.createCSR = createCSR
module.exports.createCertificate = createCertificate
module.exports.readCertificateInfo = readCertificateInfo
module.exports.getPublicKey = getPublicKey
module.exports.getFingerprint = getFingerprint
module.exports.getModulus = getModulus
module.exports.getDhparamInfo = getDhparamInfo
module.exports.createPkcs12 = createPkcs12
module.exports.readPkcs12 = readPkcs12
module.exports.createPkcs8 = createPkcs8
module.exports.verifySigningChain = verifySigningChain
module.exports.checkCertificate = checkCertificate
module.exports.checkPkcs12 = checkPkcs12
module.exports.config = config

/**
 * quick access the convert module
 * @type {module:convert}
 */
module.exports.convert = require('./convert')

/**
 * Certificate authority helper
 * @type {module:ca}
 */
module.exports.CA = require('./ca')

var KEY_START = '-----BEGIN PRIVATE KEY-----'
var KEY_END = '-----END PRIVATE KEY-----'
var RSA_KEY_START = '-----BEGIN RSA PRIVATE KEY-----'
var RSA_KEY_END = '-----END RSA PRIVATE KEY-----'
var ENCRYPTED_KEY_START = '-----BEGIN ENCRYPTED PRIVATE KEY-----'
var ENCRYPTED_KEY_END = '-----END ENCRYPTED PRIVATE KEY-----'
var CERT_START = '-----BEGIN CERTIFICATE-----'
var CERT_END = '-----END CERTIFICATE-----'

function convertKeyToTraditional(key: string, algorithm: string, searchString: string, options: CreatePrivateKeyOptions | PrivateKeyCallback | undefined, callback: PrivateKeyCallback): void
function convertKeyToTraditional(key: string, algorithm: string, searchString: string, callback: PrivateKeyCallback): void
function convertKeyToTraditional(key: string, algorithm: string, searchString: string, options: any, callback?: any) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      convertKeyToTraditional(key, algorithm, searchString, options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  function done(err?: Error | string | null) {
    if (err) {
      return callback(err)
    }
    return callback(null, {
      key: key
    })
  }
  if (key && searchString) {
    if (!(getFips() && options && options.cipher && (helper.ciphers.indexOf(options.cipher) !== -1))) {
      var params = ['pkey', '-traditional']
      if (openssl.get('Vendor') !== "OPENSSL") {
        params = [algorithm]
      }

      params.push('-in')
      params.push('--TMPFILE--')
      var delTempPWFiles: string[] = []
      if (options && options.cipher && (helper.ciphers.indexOf(options.cipher) !== -1) && options.password) {
        debug('helper.createPasswordFile', {
          cipher: '',
          password: options.password,
          passType: 'in'
        })
        helper.createPasswordFile({
          cipher: '',
          password: options.password,
          passType: 'in'
        }, params, delTempPWFiles)

        debug('helper.createPasswordFile', {
          cipher: options.cipher,
          password: options.password,
          passType: 'out'
        })
        helper.createPasswordFile({
          cipher: options.cipher,
          password: options.password,
          passType: 'out'
        }, params, delTempPWFiles)
      }

      debug('version', openssl.get('openSslVersion'))

      openssl.exec(params, searchString, [key], function (sslErr: Error | null, traditional_key: string) {

        helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
          debug('convertKeyToTraditional', {
            sslErr: sslErr,
            fsErr: fsErr,
            key: traditional_key,
            keyLength: traditional_key && traditional_key.length
          })
          key = traditional_key
          done(sslErr || fsErr)
        })
      })
    } else {
      done()
    }
  } else {
    done(new Error('No key or search string provided for conversion'))
  }
}

/**
 * Creates a private key
 *
 * @static
 * @param {Number} [keyBitsize=2048] Size of the key, defaults to 2048bit
 * @param {Object} [options] object of cipher and password {cipher:'aes128',password:'xxx'}, defaults empty object
 * @param {String} [options.cipher] string of the cipher for the encryption - needed with password
 * @param {String} [options.password] string of the cipher password for the encryption needed with cipher
 * @param {Function} callback Callback function with an error object and {key}
 * @returns {Promise<{key: String}>} Resolves with the generated key when no callback is provided.
 */
function createPrivateKey(keyBitsize: number | PrivateKeyCallback | undefined, options: CreatePrivateKeyOptions | PrivateKeyCallback | undefined, callback: PrivateKeyCallback) {
  if (!callback && !options && typeof keyBitsize === 'function') {
    callback = keyBitsize
    keyBitsize = undefined
    options = {}
  } else if (!callback && keyBitsize && typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createPrivateKey(keyBitsize, options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  keyBitsize = Number(keyBitsize) || 2048

  var params = ['genpkey', '-algorithm', 'RSA']

  var delTempPWFiles: string[] = []

  if (options && (options as CreatePrivateKeyOptions).cipher && (helper.ciphers.indexOf((options as CreatePrivateKeyOptions).cipher as string) !== -1) && (options as CreatePrivateKeyOptions).password) {
    debug('helper.createPasswordFile', {
      cipher: (options as CreatePrivateKeyOptions).cipher,
      password: (options as CreatePrivateKeyOptions).password,
      passType: 'out'
    })
    helper.createPasswordFile({
      cipher: (options as CreatePrivateKeyOptions).cipher,
      password: (options as CreatePrivateKeyOptions).password,
      passType: 'out'
    }, params, delTempPWFiles)
  }

  params.push('-pkeyopt')
  params.push(`rsa_keygen_bits:${keyBitsize}`)

  debug('version', openssl.get('openSslVersion'))

  openssl.exec(params, '(RSA |ENCRYPTED |)PRIVATE KEY', function (sslErr: Error | null, key: string) {
    function done(err?: Error | string | null) {
      if (err) {
        return callback(err)
      }
      return callback(null, {
        key: key
      })
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      debug('createPrivateKey', {
        sslErr: sslErr,
        fsErr: fsErr,
        key: key,
        keyLength: key && key.length
      })
      convertKeyToTraditional(key, 'rsa', '(RSA |ENCRYPTED |)PRIVATE KEY', options, function (convertErr, keyData) {
        if (!convertErr) {
          key = (keyData as { key: string }).key
        }
        done(sslErr || fsErr || convertErr)
      })
    })
  })
}

/**
 * Creates a dhparam key
 *
 * @static
 * @param {Number} [keyBitsize=(getFips() ? 2048 : 512)] Size of the key, defaults to 512bit in non-FIPS mode, and to 2048bit in FIPS mode
 * @param {Function} callback Callback function with an error object and {dhparam}
 * @returns {Promise<{dhparam: String}>} Resolves with the generated parameters when no callback is provided.
 */
function createDhparam(keyBitsize: number | DhparamCallback | undefined, callback: DhparamCallback) {
  if (!callback && typeof keyBitsize === 'function') {
    callback = keyBitsize
    keyBitsize = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createDhparam(keyBitsize, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  keyBitsize = Number(keyBitsize) || (getFips() ? 2048 : 512)

  var params = ['genpkey',
    '-genparam',
    '-algorithm',
    'DH',
    '-outform',
    'PEM',
    '-pkeyopt',
    `dh_paramgen_prime_len:${keyBitsize}`
  ]

  openssl.exec(params, 'DH PARAMETERS', function (error: Error | null, dhparam: string) {
    if (error) {
      return callback(error)
    }
    return callback(null, {
      dhparam: dhparam
    })
  })
}

/**
 * Creates a ecparam key
 * @static
 * @param {String} [keyName=(getFips() ? prime256v1 : secp256k1)] Name of the key, defaults to secp256k1 in non-FIPS mode, and to prime256v1 in FIPS mode
 * @param {String} [paramEnc=explicit] Encoding of the elliptic curve parameters, defaults to explicit
 * @param {Boolean} [noOut=false] This option inhibits the output of the encoded version of the parameters.
 * @param {Function} callback Callback function with an error object and {ecparam}
 * @returns {Promise<{ecparam: String}>} Resolves with the generated parameters when no callback is provided.
 */
function createEcparam(keyName: string | EcparamCallback | undefined, paramEnc: string | EcparamCallback | undefined, noOut: boolean | EcparamCallback | undefined, callback: EcparamCallback) {
  if (!callback && typeof noOut === 'undefined' && !paramEnc && typeof keyName === 'function') {
    callback = keyName
    keyName = undefined
  } else if (!callback && typeof noOut === 'undefined' && keyName && typeof paramEnc === 'function') {
    callback = paramEnc
    paramEnc = undefined
  } else if (!callback && typeof noOut === 'function' && keyName && paramEnc) {
    callback = noOut
    noOut = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createEcparam(keyName, paramEnc, noOut, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  keyName = keyName || (getFips() ? 'prime256v1' : 'secp256k1')
  paramEnc = paramEnc || 'explicit'
  noOut = noOut || false

  var params = ['genpkey',
    '-genparam',
    '-algorithm',
    'EC',
    '-pkeyopt',
    `ec_paramgen_curve:${keyName}`,
    '-pkeyopt',
    `ec_param_enc:${paramEnc}`
  ]

  var searchString = 'EC PARAMETERS'
  if (noOut) {
    params = params.filter(param => param !== '-genparam')
    searchString = '(EC |)PRIVATE KEY'
  }

  openssl.exec(params, searchString, function (error: Error | null, ecparam: string) {
    if (error) {
      return callback(error)
    }
    if (noOut) {
      convertKeyToTraditional(ecparam, 'ec', searchString, function (error, keyData) {
        if (error) {
          return callback(error)
        }
        return callback(null, {
          ecparam: (keyData as { key: string }).key
        })
      })
    }
    else {
      params = ['genpkey',
        '-paramfile',
        '--TMPFILE--'
      ]
      searchString = '(EC |)PRIVATE KEY'
      openssl.exec(params, searchString, [ecparam], function (error: Error | null, eckey: string) {
        if (error) {
          return callback(error)
        }
        convertKeyToTraditional(eckey, 'ec', searchString, function (error, keyData) {
          if (error) {
            return callback(error)
          }
          return callback(null, {
            ecparam: ecparam + '\n' + (keyData as { key: string }).key
          })
        })
      })
    }
  })
}

/**
 * Creates a Certificate Signing Request
 * If client key is undefined, a new key is created automatically. The used key is included
 * in the callback return as clientKey
 * @static
 * @param {Object} [options] Optional options object
 * @param {String} [options.clientKey] Optional client key to use
 * @param {Number} [options.keyBitsize] If clientKey is undefined, bit size to use for generating a new key (defaults to 2048)
 * @param {String} [options.hash] Hash function to use (either md5 sha1 or sha256, defaults to sha256)
 * @param {String} [options.country] CSR country field
 * @param {String} [options.state] CSR state field
 * @param {String} [options.locality] CSR locality field
 * @param {String} [options.organization] CSR organization field
 * @param {String} [options.organizationUnit] CSR organizational unit field
 * @param {String} [options.commonName='localhost'] CSR common name field
 * @param {String} [options.emailAddress] CSR email address field
 * @param {String} [options.csrConfigFile] CSR config file
 * @param {Array}  [options.altNames] is a list of subjectAltNames in the subjectAltName field
 * @param {Function} callback Callback function with an error object and {csr, clientKey}
 * @returns {Promise<{csr: String, clientKey: String, config: (String|null)}>} Resolves with the CSR details when no callback is provided.
 */
function createCSR(options: CreateCSROptions | CSRCallback | undefined, callback: CSRCallback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createCSR(options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  let delTempPWFiles: string[] = []

  options = (options || {}) as CreateCSROptions

  // http://stackoverflow.com/questions/14089872/why-does-node-js-accept-ip-addresses-in-certificates-only-for-san-not-for-cn
  if (options.commonName && (net.isIPv4(options.commonName) || net.isIPv6(options.commonName))) {
    if (!options.altNames) {
      options.altNames = [options.commonName]
    } else if (options.altNames.indexOf(options.commonName) === -1) {
      options.altNames = options.altNames.concat([options.commonName])
    }
  }

  // altNames end up in a generated OpenSSL config file; reject anything that
  // is not a plain hostname or IP so config syntax ($ENV::VAR, newlines,
  // directives) can never cross over into the CSR (GHSA-wqj4-7wgq-gcjw,
  // GHSA-vcpq-2rxr-mvmp)
  if (options.altNames && Array.isArray(options.altNames) && options.altNames.length) {
    for (var altIndex = 0; altIndex < options.altNames.length; altIndex++) {
      if (!isValidAltName(options.altNames[altIndex])) {
        return callback(new Error('Invalid altName at index ' + altIndex + ': only valid DNS hostnames and IP addresses are allowed'))
      }
    }
  }

  if (!options.clientKey) {
    if (options && (options.password || options.clientKeyPassword)) {
      options.password = options.password || options.clientKeyPassword || ''
    }
    createPrivateKey(options.keyBitsize || 2048, options, function (error, keyData) {
      if (error) {
        return callback(error)
      }
      (options as CreateCSROptions).clientKey = (keyData as { key: string }).key

      createCSR(options, callback)
    })
    return
  }

  var params = ['req',
    '-new',
    '-' + (options.hash || 'sha256')
  ]

  if (options.csrConfigFile) {
    params.push('-config')
    params.push(options.csrConfigFile)
  } else {
    params.push('-subj')
    params.push(generateCSRSubject(options))
  }

  params.push('-key')
  params.push('--TMPFILE--')

  var tmpfiles = [options.clientKey]
  var config: string | null = null

  if (options && (options.password || options.clientKeyPassword)) {
    helper.createPasswordFile({
      cipher: '',
      password: options.password || options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }

  if (options.altNames && Array.isArray(options.altNames) && options.altNames.length) {
    params.push('-extensions')
    params.push('v3_req')
    params.push('-config')
    params.push('--TMPFILE--')
    var altNamesRep: string[] = []
    for (var i = 0; i < options.altNames.length; i++) {
      var altName = options.altNames[i]
      var altType = net.isIP(altName) ? 'IP' : 'DNS'
      // RFC 5280 dNSName values carry no trailing label separator; strip it
      // so strict verifiers (e.g. LibreSSL >= 3.5) accept the CSR.
      if (altType === 'DNS') {
        altName = altName.replace(/\.$/, '')
      }
      altNamesRep.push(altType + '.' + (i + 1) + ' = ' + altName)
    }

    tmpfiles.push(config = [
      '[req]',
      'req_extensions = v3_req',
      'distinguished_name = req_distinguished_name',
      '[v3_req]',
      // CA extensions and subjectAltName are not mutually exclusive: a CA
      // certificate with altNames needs both, so merge them into one
      // v3_req section (previously altNames dropped the CA extensions,
      // producing a certificate unusable for chain verification).
      typeof options.CA === 'boolean' ? 'basicConstraints = critical,CA:' + options.CA : null,
      options.CA === true ? 'keyUsage = critical,keyCertSign,cRLSign' : null,
      options.CA === true ? 'subjectKeyIdentifier = hash' : null,
      'subjectAltName = @alt_names',
      '[alt_names]',
      altNamesRep.join('\n'),
      '[req_distinguished_name]',
      'commonName = Common Name',
      'commonName_max = 64'
    ].filter(function (line) {
      return line !== null
    }).join('\n'))
  } else if (options.config) {
    config = options.config
  } else if (typeof options.CA === 'boolean') {
    // Newer OpenSSL releases (>= 3.5) enforce RFC 5280 when verifying
    // chains, so a CA certificate must also carry keyUsage and a
    // subjectKeyIdentifier alongside the basic constraints.
    var caConfig = [
      '[req]',
      'req_extensions = v3_req',
      '[v3_req]',
      `basicConstraints = critical,CA:${options.CA}`
    ]
    if (options.CA) {
      caConfig.push('keyUsage = critical,keyCertSign,cRLSign')
      caConfig.push('subjectKeyIdentifier = hash')
    }
    config = caConfig.join('\n')
  }


  if (options.clientKeyPassword) {
    helper.createPasswordFile({
      cipher: '',
      password: options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }

  openssl.exec(params, 'CERTIFICATE REQUEST', tmpfiles, function (sslErr: Error | null, data: string) {
    function done(err: Error | string | null) {
      if (err) {
        return callback(err)
      }
      callback(null, {
        csr: data,
        config: config,
        clientKey: (options as CreateCSROptions).clientKey as string
      })
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(sslErr || fsErr)
    })
  })
}

/**
 * Creates a certificate based on a CSR. If CSR is not defined, a new one
 * will be generated automatically. For CSR generation all the options values
 * can be used as with createCSR.
 * @static
 * @param {Object} [options] Optional options object
 * @param {String} [options.serviceCertificate] PEM encoded certificate
 * @param {String} [options.serviceKey] Private key for signing the certificate, if not defined a new one is generated
 * @param {String} [options.serviceKeyPassword] Password of the service key
 * @param {Boolean} [options.selfSigned] If set to true and serviceKey is not defined, use clientKey for signing
 * @param {String|Number} [options.serial] Set a serial max. 20 octets - only together with options.serviceCertificate
 * @param {String} [options.serialFile] Set the name of the serial file, without extension. - only together with options.serviceCertificate and never in tandem with options.serial
 * @param {String} [options.hash] Hash function to use (either md5 sha1 or sha256, defaults to sha256)
 * @param {String} [options.csr] CSR for the certificate, if not defined a new one is generated
 * @param {Number} [options.days] Certificate expire time in days
 * @param {String} [options.clientKeyPassword] Password of the client key
 * @param {String} [options.extFile] extension config file - without '-extensions v3_req'
 * @param {String} [options.config] extension config file - with '-extensions v3_req'
 * @param {String} [options.csrConfigFile] CSR config file - only used if no options.csr is provided
 * @param {Array}  [options.altNames] is a list of subjectAltNames in the subjectAltName field - only used if no options.csr is provided
 * @param {Function} callback Callback function with an error object and {certificate, csr, clientKey, serviceKey}
 * @returns {Promise<{certificate: String, csr: String, clientKey: String, serviceKey: String}>} Resolves with the certificate data when no callback is provided.
 */
function createCertificate(options: CreateCertificateOptions | CertificateCallback | undefined, callback: CertificateCallback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createCertificate(options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  options = (options || {}) as CreateCertificateOptions

  if (!options.csr) {
    createCSR(options, function (error, keyData) {
      if (error) {
        return callback(error)
      }
      (options as CreateCertificateOptions).csr = (keyData as { csr: string; clientKey: string; config: string | null }).csr
      ;(options as CreateCertificateOptions).config = (keyData as { csr: string; clientKey: string; config: string | null }).config
      ;(options as CreateCertificateOptions).clientKey = (keyData as { csr: string; clientKey: string; config: string | null }).clientKey
      createCertificate(options, callback)
    })
    return
  }

  if (!options.clientKey) {
    options.clientKey = ''
  }

  if (!options.serviceKey) {
    if (options.selfSigned) {
      options.serviceKey = options.clientKey
    } else {
      createPrivateKey(options.keyBitsize || 2048, {
        cipher: options.cipher,
        password: options.clientKeyPassword || ''
      }, function (error, keyData) {
        if (error) {
          return callback(error)
        }
        (options as CreateCertificateOptions).serviceKey = (keyData as { key: string }).key
        createCertificate(options, callback)
      })
      return
    }
  }

  readCertificateInfo(options.csr, function (error2, data2) {
    if (error2) {
      return callback(error2)
    }

    // Extensions from the CSR are untrusted input: only re-emit them when
    // explicitly requested (2.0.0 no longer copies them by default), and
    // validate every value against the allowlist BEFORE any temporary
    // password files are created below, so rejecting a hostile CSR can
    // never leave those files behind (GHSA-445w-cp49-3x4p)
    var altNamesRep: string[] = []
    if (options.copyExtensions && !options.config && !options.extFile) {
      var invalidSan: string | null = null
      var san = (data2 && data2.san) || {}
      var dnsEntries = Array.isArray(san.dns) ? san.dns : []
      var ipEntries = Array.isArray(san.ip) ? san.ip : []
      var emailEntries = Array.isArray(san.email) ? san.email : []

      for (var i = 0; i < dnsEntries.length && !invalidSan; i++) {
        // isValidDNSName accepts the root form ("example.com."); strip the
        // trailing label separator so the re-emitted SAN is RFC 5280 clean.
        if (isValidDNSName(dnsEntries[i])) {
          altNamesRep.push('DNS' + '.' + (i + 1) + ' = ' + dnsEntries[i].replace(/\.$/, ''))
        } else {
          invalidSan = 'DNS.' + (i + 1)
        }
      }
      for (var i2 = 0; i2 < ipEntries.length && !invalidSan; i2++) {
        if (net.isIP(ipEntries[i2]) > 0) {
          altNamesRep.push('IP' + '.' + (i2 + 1) + ' = ' + ipEntries[i2])
        } else {
          invalidSan = 'IP.' + (i2 + 1)
        }
      }
      for (var i3 = 0; i3 < emailEntries.length && !invalidSan; i3++) {
        if (isValidSANEmail(emailEntries[i3])) {
          altNamesRep.push('email' + '.' + (i3 + 1) + ' = ' + emailEntries[i3])
        } else {
          invalidSan = 'email.' + (i3 + 1)
        }
      }

      if (invalidSan) {
        return callback(new Error('Refusing to copy subjectAltName from the CSR: invalid entry ' + invalidSan))
      }
    }

    var params = ['x509',
      '-req',
      '-' + (options.hash || 'sha256'),
      '-days',
      Number(options.days) || '365',
      '-in',
      '--TMPFILE--'
    ]
    var tmpfiles = [options.csr]
    var delTempPWFiles: string[] = []

    if (options.serviceCertificate) {
      params.push('-CA')
      params.push('--TMPFILE--')
      params.push('-CAkey')
      params.push('--TMPFILE--')
      if (options.serial) {
        params.push('-set_serial')
        if (helper.isNumber(options.serial)) {
          // set the serial to the max lenth of 20 octets ()
          // A certificate serial number is not decimal conforming. That is the
          // bytes in a serial number do not necessarily map to a printable ASCII
          // character.
          // eg: 0x00 is a valid serial number and can not be represented in a
          // human readable format (atleast one that can be directly mapped to
          // the ACSII table).
          params.push('0x' + ('0000000000000000000000000000000000000000' + (options.serial as number).toString(16)).slice(-40))
        } else {
          if (helper.isHex(options.serial)) {
            if ((options.serial as string).startsWith('0x')) {
              options.serial = (options.serial as string).substring(2, (options.serial as string).length)
            }
            params.push('0x' + ('0000000000000000000000000000000000000000' + options.serial).slice(-40))
          } else {
            params.push('0x' + ('0000000000000000000000000000000000000000' + helper.toHex(options.serial as string)).slice(-40))
          }
        }
      } else {
        params.push('-CAcreateserial')
        if (options.serialFile) {
          params.push('-CAserial')
          params.push(options.serialFile + '.srl')
        }
      }
      if (options.serviceKeyPassword) {
        helper.createPasswordFile({
          cipher: '',
          password: options.serviceKeyPassword,
          passType: 'in'
        }, params as string[], delTempPWFiles)
      }
      tmpfiles.push(options.serviceCertificate)
      tmpfiles.push(options.serviceKey)
    } else {
      params.push('-signkey')
      params.push('--TMPFILE--')
      if (options.serviceKeyPassword) {
        helper.createPasswordFile({
          cipher: '',
          password: options.serviceKeyPassword,
          passType: 'in'
        }, params as string[], delTempPWFiles)
      }
      tmpfiles.push(options.serviceKey)
    }

    if (options.config) {
      params.push('-extensions')
      params.push('v3_req')
      params.push('-extfile')
      params.push('--TMPFILE--')
      tmpfiles.push(options.config)
    } else if (options.extFile) {
      params.push('-extfile')
      params.push(options.extFile)
    } else if (altNamesRep.length) {
      params.push('-extensions')
      params.push('v3_req')
      params.push('-extfile')
      params.push('--TMPFILE--')
      tmpfiles.push([
        '[v3_req]',
        'subjectAltName = @alt_names',
        '[alt_names]',
        altNamesRep.join('\n')
      ].join('\n'))
    }

    if (options.clientKeyPassword) {
      helper.createPasswordFile({
        cipher: '',
        password: options.clientKeyPassword,
        passType: 'in'
      }, params as string[], delTempPWFiles)
    }

    openssl.exec(params, 'CERTIFICATE', tmpfiles, function (sslErr: Error | null, data: string) {
      function done(err: Error | string | null) {
        if (err) {
          return callback(err)
        }
        var response = {
          csr: (options as CreateCertificateOptions).csr as string,
          clientKey: (options as CreateCertificateOptions).clientKey as string,
          certificate: data,
          serviceKey: (options as CreateCertificateOptions).serviceKey as string
        }
        return callback(null, response)
      }

      helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
        done(sslErr || fsErr)
      })
    })
  })
}

/**
 * Exports a public key from a private key, CSR or certificate
 * @static
 * @param {String} certificate PEM encoded private key, CSR or certificate
 * @param {Function} callback Callback function with an error object and {publicKey}
 * @returns {Promise<{publicKey: String}>} Resolves with the extracted public key when no callback is provided.
 */
function getPublicKey(certificate: string | Buffer | GetPublicKeyCallback | undefined, callback: GetPublicKeyCallback) {
  if (!callback && typeof certificate === 'function') {
    callback = certificate
    certificate = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      getPublicKey(certificate, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  certificate = (certificate || '').toString()

  var params

  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    params = ['req',
      '-in',
      '--TMPFILE--',
      '-pubkey',
      '-noout'
    ]
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/)) {
    params = ['pkey',
      '-in',
      '--TMPFILE--',
      '-pubout'
    ]
  } else {
    params = ['x509',
      '-in',
      '--TMPFILE--',
      '-pubkey',
      '-noout'
    ]
  }

  openssl.exec(params, 'PUBLIC KEY', certificate, function (error: Error | null, key: string) {
    if (error) {
      return callback(error)
    }
    return callback(null, {
      publicKey: key
    })
  })
}

/**
 * Reads subject data from a certificate or a CSR
 * @static
 * @param {String} certificate PEM encoded CSR or certificate
 * @param {Function} callback Callback function with an error object and {country, state, locality, organization, organizationUnit, commonName, emailAddress}
 * @returns {Promise<Object>} Resolves with the parsed certificate information when no callback is provided.
 */
function readCertificateInfo(certificate: string | Buffer | ReadCertificateInfoCallback | undefined, callback: ReadCertificateInfoCallback) {
  if (!callback && typeof certificate === 'function') {
    callback = certificate
    certificate = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      readCertificateInfo(certificate, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  certificate = (certificate || '').toString()
  var isMatch = certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)
  var type = isMatch ? 'req' : 'x509'
  var params = [type,
    '-noout',
    '-nameopt',
    'RFC2253,sep_multiline,space_eq,-esc_msb,utf8',
    '-text',
    '-in',
    '--TMPFILE--'
  ]
  openssl.spawnWrapper(params, certificate, function (err: Error | null, code: number | null, stdout: string, stderr: string) {
    if (err) {
      return callback(err)
    } else if (stderr) {
      return callback(stderr)
    }
    return fetchCertificateData(stdout, callback)
  })
}

/**
 * get the modulus from a certificate, a CSR or a private key
 * @static
 * @param {String} certificate PEM encoded, CSR PEM encoded, or private key
 * @param {String} [password] password for the certificate
 * @param {String} [hash] hash function to use (up to now `md5` supported) (default: none)
 * @param {Function} callback Callback function with an error object and {modulus}
 * @returns {Promise<{modulus: String}>} Resolves with the modulus information when no callback is provided.
 */
function getModulus(certificate: string | Buffer, password: string | GetModulusCallback | undefined, hash: string | false | GetModulusCallback | undefined, callback: GetModulusCallback) {
  if (!callback && !hash && typeof password === 'function') {
    callback = password
    password = undefined
    hash = false
  } else if (!callback && hash && typeof hash === 'function') {
    callback = hash
    hash = false
    // password will be falsy if not provided
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      getModulus(certificate, password, hash, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }
  // adding hash function to params, is not supported by openssl.
  // process piping would be the right way (... | openssl md5)
  // No idea how this can be achieved in easy with the current build in methods
  // of pem.
  if (hash && hash !== 'md5') {
    hash = false
  }

  certificate = ((Buffer.isBuffer(certificate) && certificate.toString()) || certificate) as string

  let type
  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    type = 'req'
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/) || certificate.match(/BEGIN ENCRYPTED PRIVATE KEY/)) {
    type = 'pkey'
  } else {
    type = 'x509'
  }
  let params = [
    type,
    '-noout',
    '-in',
    '--TMPFILE--'
  ]

  switch (params[0]) {
    case 'pkey':
      params.push('-text_pub')
      break
    default:
      params.push('-modulus')
      break
  }

  let delTempPWFiles: string[] = []
  if (password) {
    helper.createPasswordFile({cipher: '', password: password as string, passType: 'in'}, params, delTempPWFiles)
  }

  openssl.spawnWrapper(params, certificate, function (sslErr: Error | null, code: number | null, stdout: string, stderr: string) {
    function done(err: Error | string | null) {
      if (err) {
        return callback(err)
      }
      var match: RegExpMatchArray | null
      switch (params[0]) {
        case 'pkey':
          match = stdout.match(/Modulus:\s+([\s\S]+?)(?=\n[a-zA-Z0-9]+:|$)/i)
          break
        default:
          match = stdout.match(/Modulus=([0-9a-fA-F]+)$/m)
          break
      }
      if (match) {
        match[1] = match[1].replace(/[\s:]+/g, '').replace(/^0+/, '').toUpperCase()
        if (hash === 'md5') {
          return callback(null, {
            modulus: hash_md5(match[1])
          })
        }

        return callback(null, {
          modulus: match[1]
        })

      } else {
        return callback(new Error('No modulus'))
      }
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(sslErr || fsErr || stderr)
    })
  })
}

/**
 * get the size and prime of DH parameters
 * @static
 * @param {String} dh parameters PEM encoded
 * @param {Function} callback Callback function with an error object and {size, prime}
 * @returns {Promise<{size: Number, prime: String}>} Resolves with DH parameter details when no callback is provided.
 */
function getDhparamInfo(dh: string | Buffer, callback: GetDhparamInfoCallback) {
  if (!callback) {
    return new Promise(function (resolve, reject) {
      getDhparamInfo(dh, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  dh = ((Buffer.isBuffer(dh) && dh.toString()) || dh) as string

  var params = [
    'pkeyparam',
    '-text',
    '-in',
    '--TMPFILE--'
  ]

  openssl.spawnWrapper(params, dh, function (err: Error | null, code: number | null, stdout: string, stderr: string) {
    if (err) {
      return callback(err)
    } else if (stderr) {
      return callback(stderr)
    }

    var result: { size?: number; group?: string; prime?: string } = {}
    // Match the DH marker specifically: EC parameters print
    // "EC-Parameters: (N bit)" / "ECDSA-Parameters: (N bit)" instead, and
    // their ASN.1 starts with a version INTEGER that must not be mistaken
    // for the DH prime below.
    var match: RegExpMatchArray | null = stdout.match(/DH Parameters: \((\d+) bit\)/)

    if (match) {
      result.size = Number(match[1])
    }

    match = stdout.match(/GROUP: \((\d+) bit\)/)

    if (match) {
      result.group = match[1]
    }

    if (!result.size && !result.group) {
      return callback(new Error('No DH parameters found'))
    }

    params = [
      'asn1parse',
      '-in',
      '--TMPFILE--'
    ]

    openssl.spawnWrapper(params, dh, function (err: Error | null, code: number | null, stdout: string, stderr: string) {
      if (err) {
        return callback(err)
      } else if (stderr) {
        return callback(stderr)
      }

      match = stdout.match(/INTEGER\s+:([0-9A-F]+)/i)

      if (match) {
        result.prime = match[1].trim().toLowerCase().replace(/(.{2})(?!$)/g, '$&:')
      }

      if (!result.size && !result.prime) {
        return callback(new Error('No DH info found'))
      }

      return callback(null, result)
    })
  })
}

/**
 * config the pem module
 * @static
 * @param {Object} options
 */
function config(options: Record<string, unknown>) {
  Object.keys(options).forEach(function (k) {
    openssl.set(k, options[k])
  })
}

/**
 * Gets the fingerprint for a certificate
 * @static
 * @param {String} certificate PEM encoded certificate
 * @param {String} [hash] hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha1`)
 * @param {Function} callback Callback function with an error object and {fingerprint}
 * @returns {Promise<{fingerprint: String}>} Resolves with the fingerprint when no callback is provided.
 */
function getFingerprint(certificate: string | Buffer, hash: string | GetFingerprintCallback | undefined, callback: GetFingerprintCallback) {
  if (!callback && typeof hash === 'function') {
    callback = hash
    hash = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      getFingerprint(certificate, hash, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  hash = hash || 'sha1'

  var params = ['x509',
    '-in',
    '--TMPFILE--',
    '-fingerprint',
    '-noout',
    '-' + hash
  ]

  openssl.spawnWrapper(params, certificate, function (err: Error | null, code: number | null, stdout: string, stderr: string) {
    if (err) {
      return callback(err)
    } else if (stderr) {
      return callback(stderr)
    }
    var match = stdout.match(/Fingerprint=([0-9a-fA-F:]+)$/m)
    if (match) {
      return callback(null, {
        fingerprint: match[1]
      })
    } else {
      return callback(new Error('No fingerprint'))
    }
  })
}

/**
 * Export private key and certificate to a PKCS12 keystore
 * @static
 * @param {String} key PEM encoded private key
 * @param {String} certificate PEM encoded certificate
 * @param {String} password Password of the result PKCS12 file
 * @param {Object} [options] object of cipher and optional client key password {cipher:'aes128', clientKeyPassword: 'xxxx', certFiles: ['file1','file2']} as well as PBE algorithm selection {certpbe: 'AES-256-CBC', keypbe: 'AES-256-CBC', macalg: 'sha256'}
 * @param {Function} callback Callback function with an error object and {pkcs12}
 * @returns {Promise<{pkcs12: Buffer}>} Resolves with the PKCS#12 bundle when no callback is provided.
 */
function createPkcs12(key: string, certificate: string, password: string, options: CreatePkcs12Options | CreatePkcs12Callback | undefined, callback: CreatePkcs12Callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createPkcs12(key, certificate, password, options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  options = (options || {}) as CreatePkcs12Options

  var params = ['pkcs12', '-export']
  var delTempPWFiles: string[] = []

  if (options.cipher && options.clientKeyPassword) {
    // NOTICE: The password field is needed! self if it is empty.
    // create password file for the import "-passin"
    helper.createPasswordFile({
      cipher: options.cipher,
      password: options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }
  // NOTICE: The password field is needed! self if it is empty.
  // create password file for the password "-password"
  helper.createPasswordFile({cipher: '', password: password, passType: 'word'}, params, delTempPWFiles)

  params.push('-in')
  params.push('--TMPFILE--')
  params.push('-inkey')
  params.push('--TMPFILE--')

  var tmpfiles = [certificate, key]

  if (options.certFiles) {
    tmpfiles.push(options.certFiles.join(''))

    params.push('-certfile')
    params.push('--TMPFILE--')
  }

  // PBE algorithm selection — with OpenSSL 3 the legacy defaults of older
  // openssl builds can produce PKCS#12 data the Node TLS stack rejects
  // ("Unsupported PKCS12 PFX data", issue #406), so cert/key encryption and
  // MAC digest are user-selectable.
  if (options.certpbe) {
    params.push('-certpbe')
    params.push(options.certpbe)
  }

  if (options.keypbe) {
    params.push('-keypbe')
    params.push(options.keypbe)
  }

  if (options.macalg) {
    params.push('-macalg')
    params.push(options.macalg)
  }

  // In FIPS mode PKCS12KDF is unavailable, so the MAC must switch to
  // PBMAC1+PBKDF2. The flag exists only since OpenSSL 3.4; passing it to
  // 3.0-3.3 aborts the command ("Unknown option or cipher").
  if (openssl.get('Vendor') === "OPENSSL" && openssl.atLeastVersion(3, 4) && getFips()) {
    params.push('-pbmac1_pbkdf2')
  }

  openssl.execBinary(params, tmpfiles, function (sslErr: Error | null, pkcs12: Buffer) {
    function done(err: Error | string | null) {
      if (err) {
        return callback(err)
      }
      return callback(null, {
        pkcs12: pkcs12
      })
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(sslErr || fsErr)
    })
  })
}

/**
 * read sslcert data from Pkcs12 file. Results are provided in callback response in object notation ({cert: .., ca:..., key:...})
 * @static
 * @param  {Buffer|String}   bufferOrPath Buffer or path to file
 * @param  {Object}   [options]      openssl options
 * @param  {Function} callback     Called with error object and sslcert bundle object
 * @returns {Promise<{cert: String, ca: Array, key: String}>} Resolves with the parsed PKCS#12 bundle when no callback is provided.
 */
function readPkcs12(bufferOrPath: Buffer | string, options: ReadPkcs12Options | ReadPkcs12Callback | undefined, callback: ReadPkcs12Callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      readPkcs12(bufferOrPath, options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  options = (options || {}) as ReadPkcs12Options

  options.p12Password = options.p12Password || ''

  var tmpfiles: (Buffer)[] = []
  var delTempPWFiles: string[] = []
  var args = ['pkcs12', '-in', bufferOrPath]

  helper.createPasswordFile({cipher: '', password: options.p12Password, passType: 'in'}, args as string[], delTempPWFiles)

  if (Buffer.isBuffer(bufferOrPath)) {
    tmpfiles = [bufferOrPath]
    args[2] = '--TMPFILE--'
  }

  // Non-FIPS OpenSSL 3.x needs -legacy for the RC2-based default formats.
  // Reading needs no PBMAC1 flag in FIPS mode: the MAC is detected from the
  // input, and the flag only exists since 3.4 anyway.
  if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3 && !getFips()) {
    args.push('-legacy')
    args.push('-traditional')
  }

  if (options.clientKeyPassword) {
    helper.createPasswordFile({
      cipher: '',
      password: options.clientKeyPassword,
      passType: 'out'
    }, args as string[], delTempPWFiles)
  } else {
    args.push('-nodes')
  }

  openssl.execBinary(args, tmpfiles, function (sslErr: Error | null, stdout: string) {
    function done(err: (Error & { code?: string }) | null) {
      var keybundle: { cert?: string; ca?: string[]; key?: string } = {}

      if (err && err.message.indexOf('No such file or directory') !== -1) {
        err.code = 'ENOENT'
      }

      if (!err) {
        var certs = readFromString(stdout, CERT_START, CERT_END)
        keybundle.cert = certs.shift()
        keybundle.ca = certs
        keybundle.key = readFromString(stdout, KEY_START, KEY_END).pop()

        debug("readPkcs12.execBinary - PRIVATE KEY - ?: ", keybundle.key)
        if (keybundle.key) {
          // convert to RSA key
          return convertKeyToTraditional(keybundle.key, 'rsa', '(RSA |)PRIVATE KEY', function (err, key) {
            if (err) {
              debug("readPkcs12.execBinary - PRIVATE KEY convert - error: ", err)
            }
            //debug("readPkcs12.execBinary - PRIVATE KEY", key)
            else if (key && key.key) {
              keybundle.key = key.key
            }

            return callback(err, keybundle)
          })
        }

        if ((options as ReadPkcs12Options).clientKeyPassword) {
          keybundle.key = readFromString(stdout, ENCRYPTED_KEY_START, ENCRYPTED_KEY_END).pop()
          debug("readPkcs12.execBinary - ENCRYPTED PRIVATE KEY - ?: ", keybundle.key)
          /*return openssl.exec(['rsa', '-in', '--TMPFILE--'], 'RSA PRIVATE KEY', [keybundle.key], function (err, key) {
            if (err) {
              debug("readPkcs12.execBinary - ENCRYPTED PRIVATE KEY - error: ", err)
            }
            debug("readPkcs12.execBinary - ENCRYPTED PRIVATE KEY", key)
            keybundle.key = key

            return callback(err, keybundle)
          })*/
        } else {
          keybundle.key = readFromString(stdout, RSA_KEY_START, RSA_KEY_END).pop()
          debug("readPkcs12.execBinary - RSA PRIVATE KEY - ?: ", keybundle.key)
          /*return openssl.exec(['rsa', '-in', '--TMPFILE--'], 'RSA PRIVATE KEY', [keybundle.key], function (err, key) {
            if (err) {
              debug("readPkcs12.execBinary - RSA PRIVATE KEY - error: ", err)
            }
            debug("readPkcs12.execBinary - RSA PRIVATE KEY", key)
            keybundle.key = key

            return callback(err, keybundle)
          })*/
        }
      }

      return callback(err, keybundle)
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(sslErr || fsErr)
    })
  })
}

/**
 * Convert a private key to PKCS#8 format
 * @static
 * @param {String} key PEM encoded private key (may be encrypted)
 * @param {Object} [options] object with optional source key decryption {clientKeyPassword: 'xxxx'} and output encryption {cipher: 'aes256', password: 'xxxx'} as well as {outform: 'PEM'|'DER'}
 * @param {Function} callback Callback function with an error object and {pkcs8}
 * @returns {Promise<{pkcs8: string|Buffer}>} Resolves with the PKCS#8 key when no callback is provided.
 */
function createPkcs8(key: string, options: CreatePkcs8Options | CreatePkcs8Callback | undefined, callback: CreatePkcs8Callback) {
  if (!callback && typeof options === 'function') {
    callback = options
    options = {}
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      createPkcs8(key, options, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  options = (options || {}) as CreatePkcs8Options

  var outform = (options.outform || 'PEM')
  var params = ['pkcs8', '-topk8', '-inform', 'PEM', '-outform', outform]
  var delTempPWFiles: string[] = []

  if (options.clientKeyPassword) {
    // decrypt the source key while reading it ("-passin")
    helper.createPasswordFile({
      cipher: '',
      password: options.clientKeyPassword,
      passType: 'in'
    }, params, delTempPWFiles)
  }

  if (options.password) {
    // pkcs8 selects its encryption cipher via "-v2 <cipher>" — the "-<cipher>"
    // shorthand form that createPasswordFile pushes is not accepted here
    if (options.cipher && helper.ciphers.indexOf(options.cipher) !== -1) {
      params.push('-v2')
      params.push(options.cipher)
    }
    // encrypt the PKCS#8 output ("-passout"; without -v2 openssl picks the default)
    helper.createPasswordFile({
      cipher: '',
      password: options.password,
      passType: 'out'
    }, params, delTempPWFiles)
  }

  if (!options.password) {
    params.push('-nocrypt')
  }

  params.push('-in')
  params.push('--TMPFILE--')

  function done(sslErr: Error | string | null, pkcs8: string | Buffer) {
    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      if (sslErr || fsErr) {
        return callback(sslErr || fsErr)
      }
      return callback(null, {
        pkcs8: pkcs8
      })
    })
  }

  if (outform === 'DER') {
    openssl.execBinary(params, [key], function (sslErr: Error | null, pkcs8: Buffer) {
      done(sslErr, pkcs8)
    })
  } else {
    // exec extracts the PEM block by header; the encrypted header differs
    openssl.exec(params, options.password ? 'ENCRYPTED PRIVATE KEY' : 'PRIVATE KEY', [key], function (sslErr: Error | string | null, pkcs8: string) {
      done(sslErr, pkcs8)
    })
  }
}

/**
 * Check a certificate
 * @static
 * @param {String} certificate PEM encoded certificate
 * @param {String} [passphrase] password for the certificate
 * @param {Function} callback Callback function with an error object and a boolean valid
 * @returns {Promise<Boolean>} Resolves with the validity result when no callback is provided.
 */
function checkCertificate(certificate: string | Buffer | CheckCertificateCallback | undefined, passphrase: string | CheckCertificateCallback | undefined, callback: CheckCertificateCallback) {
  var params: string[]
  var delTempPWFiles: string[] = []

  if (!callback && typeof passphrase === 'function') {
    callback = passphrase
    passphrase = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      checkCertificate(certificate, passphrase, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }
  certificate = (certificate || '').toString()

  if (certificate.match(/BEGIN(\sNEW)? CERTIFICATE REQUEST/)) {
    params = ['req', '-text', '-noout', '-verify', '-in', '--TMPFILE--']
  } else if (certificate.match(/BEGIN RSA PRIVATE KEY/) || certificate.match(/BEGIN PRIVATE KEY/) || certificate.match(/BEGIN ENCRYPTED PRIVATE KEY/)) {
    params = [(openssl.get('Vendor') === "OPENSSL") ? 'pkey' : 'rsa', '-noout', '-check', '-in', '--TMPFILE--']
  } else {
    params = ['x509', '-text', '-noout', '-in', '--TMPFILE--']
  }
  if (passphrase) {
    helper.createPasswordFile({cipher: '', password: passphrase as string, passType: 'in'}, params, delTempPWFiles)
  }

  openssl.spawnWrapper(params, certificate, function (sslErr: Error | null, code: number | null, stdout: string, stderr: string) {
    function done(err: Error | string | null) {

      stdout = stdout && stdout.trim()
      var result: boolean
      switch (params[0]) {
        case 'pkey':
          result = /^Key is valid$/i.test(stdout)
          break
        case 'rsa':
          result = /^Rsa key ok$/i.test(stdout)
          break
        default:
          result = /Signature Algorithm/im.test(stdout)
          break
      }
      if (!result) {
        if (err && err.toString().trim() !== 'verify OK') {
          return callback(err)
        }
        if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
          if (!(stderr && stderr.toString().trim().endsWith('verify OK'))) {
            return callback(new Error(stderr.toString()))
          }
        }
      }
      callback(null, result)
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      done(sslErr || fsErr || stderr)
    })
  })
}

/**
 * check a PKCS#12 file (.pfx or.p12)
 * @static
 * @param {Buffer|String} bufferOrPath PKCS#12 certificate
 * @param {String} [passphrase] optional passphrase which will be used to open the keystore
 * @param {Function} callback Callback function with an error object and a boolean valid
 * @returns {Promise<Boolean>} Resolves with the validity result when no callback is provided.
 */
function checkPkcs12(bufferOrPath: Buffer | string, passphrase: string | CheckPkcs12Callback | undefined, callback: CheckPkcs12Callback) {
  if (!callback && typeof passphrase === 'function') {
    callback = passphrase
    passphrase = ''
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      checkPkcs12(bufferOrPath, passphrase, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }

  var tmpfiles: Buffer[] = []
  var delTempPWFiles: string[] = []
  var args = ['pkcs12', '-info', '-in', bufferOrPath, '-noout', '-maciter', '-nodes']

  helper.createPasswordFile({cipher: '', password: passphrase as string, passType: 'in'}, args as string[], delTempPWFiles)

  if (Buffer.isBuffer(bufferOrPath)) {
    tmpfiles = [bufferOrPath]
    args[3] = '--TMPFILE--'
  }

  if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3 && !getFips()) {
    args.splice(2, 0, '-legacy');
  }

  openssl.spawnWrapper(args, tmpfiles, function (sslErr: Error | null, code: number | null, stdout: string, stderr: string) {
    debug('checkPkcs12 error', {
      err: sslErr,
      code: code,
      stdout: stdout,
      stdoutResult: (/MAC verified OK/im.test(stderr) || (!(/MAC verified OK/im.test(stderr)) && !(/Mac verify error/im.test(stderr)))),
      stderr: stderr
    })

    function done(err: Error | string | null) {
      if (err) {
        return callback(err)
      }
      callback(null, (/MAC verified OK/im.test(stderr) || (!(/MAC verified OK/im.test(stderr)) && !(/Mac verify error/im.test(stderr)))))
    }

    helper.deleteTempFiles(delTempPWFiles, function (fsErr: NodeJS.ErrnoException | null) {
      debug('checkPkcs12 clean-up error', {
        sslErr: sslErr,
        fsErr: fsErr,
        code: code,
        stdout: stdout,
        stdoutResult: (/MAC verified OK/im.test(stderr) || (!(/MAC verified OK/im.test(stderr)) && !(/Mac verify error/im.test(stderr)))),
        stderr: stderr
      })
      done(sslErr || fsErr)
    })
  })
}

/**
 * Verifies the signing chain of the passed certificate
 * @static
 * @param {String|Array} certificate PEM encoded certificate include intermediate certificates
 * The correct order of trust chain must be preserved and should start with Leaf
 * certificate. Example array: [Leaf, Int CA 1, ... , Int CA N, Root CA].
 * @param {String|Array} ca [List] of CA certificates
 * @param {Function} callback Callback function with an error object and a boolean valid
 * @returns {Promise<Boolean>} Resolves with the verification result when no callback is provided.
 */
function verifySigningChain(certificate: string | string[] | Buffer, ca: string | string[] | Buffer | VerifySigningChainCallback | undefined, callback: VerifySigningChainCallback) {
  if (!callback && typeof ca === 'function') {
    callback = ca
    ca = undefined
  }

  if (!callback) {
    return new Promise(function (resolve, reject) {
      verifySigningChain(certificate, ca, function (err, result) {
        if (err) {
          return reject(err)
        }
        resolve(result)
      })
    })
  }
  if (!Array.isArray(certificate)) {
    certificate = readFromString(certificate as string, CERT_START, CERT_END)
  }
  if (!Array.isArray(ca) && ca !== undefined) {
    if (ca !== '') {
      ca = [ca] as string[]
    }
  }

  var params = ['verify']
  var files: string[] = []

  if (ca !== undefined) {
    // ca certificates
    params.push('-CAfile')
    params.push('--TMPFILE--')
    files.push((ca as string[]).join('\n'))
  }
  // extracting the very first - leaf - cert in chain
  var leaf = certificate.shift()

  if (certificate.length > 0) {
    params.push('-untrusted')
    params.push('--TMPFILE--')
    files.push(certificate.join('\n'))
  }

  params.push('--TMPFILE--')
  files.push(leaf as string)

  openssl.spawnWrapper(params, files, function (err: Error | null, code: number | null, stdout: string, stderr: string) {
    // OPENSSL 3.x don't use stdout to print the error
    debug('Vendor', openssl.get('Vendor'))
    debug('VendorVersionMajor', openssl.get('VendorVersionMajor'))
    debug('openssl.get(\'VendorVersionMajor\') >= 3', openssl.get('VendorVersionMajor') >= 3)

    if (openssl.get('Vendor') === "OPENSSL" && openssl.get('VendorVersionMajor') >= 3) {
      let openssl30Check = !!(stdout && stdout.trim().includes(": OK"));

      if (err) {
        debug('verifySigningChain error', {
          err: err,
          code: code,
          stdout: stdout,
          stdoutResult: openssl30Check,
          stderr: stderr
        })
        return callback(err)
      }

      debug('verifySigningChain error - use stderr', {
        err: err,
        code: code,
        stdout: stdout.trim(),
        stdoutResult: openssl30Check,
        stderr: stderr.trim()
      })
      return callback(null, openssl30Check)
    }
    // END: OPENSSL 3.x don't use stdout to print the error
    if (err) {
      debug('verifySigningChain error', {
        err: err,
        code: code,
        stdout: stdout,
        stdoutResult: stdout && stdout.trim().slice(-4) === ': OK',
        stderr: stderr
      })
      return callback(err)
    }
    debug('verifySigningChain', {
      err: err,
      code: code,
      stdout: stdout,
      stdoutResult: stdout && stdout.trim().slice(-4) === ': OK',
      stderr: stderr
    })
    callback(null, stdout && stdout.trim().slice(-4) === ': OK')
  })
}

// HELPER FUNCTIONS
function fetchCertificateData(certData: string | Buffer, callback: ReadCertificateInfoCallback) {
  // try catch : if something will fail in parsing it won't crash the calling code
  try {
    certData = (certData || '').toString()

    var serial: RegExpMatchArray | null, subject: string | RegExpMatchArray | null, tmp: any, issuer: string | RegExpMatchArray | null
    var certValues: CertificateInfoValues = {
      issuer: {}
    }
    var validity: { start?: number; end?: number } = {}
    var san: string | RegExpMatchArray | null

    var ky: string, i: number

    // serial
    if ((serial = certData.match(/\s*Serial Number:\r?\n?[ \t]*([^\r\n]*)\r?\n[ \t]*/)) && serial.length > 1) {
      certValues.serial = serial[1]
    }

    if ((subject = certData.match(/\s*Subject:\r?\n([ \t]*[a-zA-Z0-9.]+\s=\s[^\r\n]+\r?\n)*[ \t]*/)) && subject.length > 1) {
      subject = subject[0]
      tmp = matchAll(subject, /\s([a-zA-Z0-9.]+)\s=\s([^\r\n].*)/g)
      if (tmp) {
        for (i = 0; i < tmp.length; i++) {
          ky = tmp[i][1].trim()
          if (ky.match('(C|ST|L|O|OU|CN|emailAddress|DC)') || ky === '') {
            continue
          }
          certValues[ky] = tmp[i][2].trim()
        }
      }

      // country
      tmp = subject.match(/\sC\s=\s([^\r\n].*?)[\r\n]/)
      certValues.country = (tmp && tmp[1]) || ''

      // state
      tmp = subject.match(/\sST\s=\s([^\r\n].*?)[\r\n]/)
      certValues.state = (tmp && tmp[1]) || ''

      // locality
      tmp = subject.match(/\sL\s=\s([^\r\n].*?)[\r\n]/)
      certValues.locality = (tmp && tmp[1]) || ''

      // organization
      tmp = matchAll(subject, /\sO\s=\s([^\r\n].*)/g)
      certValues.organization = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // unit
      tmp = matchAll(subject, /\sOU\s=\s([^\r\n].*)/g)
      certValues.organizationUnit = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // common name
      tmp = matchAll(subject, /\sCN\s=\s([^\r\n].*)/g)
      certValues.commonName = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // email
      tmp = matchAll(subject, /emailAddress\s=\s([^\r\n].*)/g)
      certValues.emailAddress = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // DC name
      tmp = matchAll(subject, /\sDC\s=\s([^\r\n].*)/g)
      certValues.dc = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''
    }

    if ((issuer = certData.match(/\s*Issuer:\r?\n([ \t]*[a-zA-Z0-9.]+\s=\s[^\r\n].*\r?\n)*[ \t]*/)) && issuer.length > 1) {
      issuer = issuer[0]
      tmp = matchAll(issuer, /\s([a-zA-Z0-9.]+)\s=\s([^\r\n].*)/g)
      if (tmp) {
        for (i = 0; i < tmp.length; i++) {
          ky = tmp[i][1].toString()
          if (ky.match('(C|ST|L|O|OU|CN|emailAddress|DC)')) {
            continue
          }
          certValues.issuer[ky] = tmp[i][2].toString()
        }
      }

      // country
      tmp = issuer.match(/\sC\s=\s([^\r\n].*?)[\r\n]/)
      certValues.issuer.country = (tmp && tmp[1]) || ''

      // state
      tmp = issuer.match(/\sST\s=\s([^\r\n].*?)[\r\n]/)
      certValues.issuer.state = (tmp && tmp[1]) || ''

      // locality
      tmp = issuer.match(/\sL\s=\s([^\r\n].*?)[\r\n]/)
      certValues.issuer.locality = (tmp && tmp[1]) || ''

      // organization
      tmp = matchAll(issuer, /\sO\s=\s([^\r\n].*)/g)
      certValues.issuer.organization = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // unit
      tmp = matchAll(issuer, /\sOU\s=\s([^\r\n].*)/g)
      certValues.issuer.organizationUnit = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var
          r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // common name
      tmp = matchAll(issuer, /\sCN\s=\s([^\r\n].*)/g)
      certValues.issuer.commonName = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var
          r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''

      // DC name
      tmp = matchAll(issuer, /\sDC\s=\s([^\r\n].*)/g)
      certValues.issuer.dc = tmp ? (tmp.length > 1 ? tmp.sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        var e = t[1].toUpperCase()
        var
          r = n[1].toUpperCase()
        return r > e ? -1 : e > r ? 1 : 0
      }).sort(function (t: RegExpMatchArray, n: RegExpMatchArray) {
        return t[1].length - n[1].length
      }).map(function (t: RegExpMatchArray) {
        return t[1]
      }) : tmp[0][1]) : ''
    }

    // SAN
    if ((san = certData.match(/X509v3 Subject Alternative Name:\s*\r?\n([^\r\n]*)\r?\n/)) && san.length > 1) {
      san = san[1].trim() + '\n'
      certValues.san = {}

      // hostnames
      tmp = pregMatchAll('DNS:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
      certValues.san.dns = tmp || ''

      // IP-Addresses IPv4 & IPv6
      tmp = pregMatchAll('IP Address:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
      certValues.san.ip = tmp || ''

      // Email Addresses
      tmp = pregMatchAll('email:([^,\\r\\n].*?)[,\\r\\n\\s]', san)
      certValues.san.email = tmp || ''
    }

    // Validity
    if ((tmp = certData.match(/Not Before\s?:\s?([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      validity.start = Date.parse((tmp && tmp[1]) || '')
    }

    if ((tmp = certData.match(/Not After\s?:\s?([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      validity.end = Date.parse((tmp && tmp[1]) || '')
    }

    if (validity.start && validity.end) {
      certValues.validity = validity
    }
    // Validity end

    // Signature Algorithm
    if ((tmp = certData.match(/Signature Algorithm: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      certValues.signatureAlgorithm = (tmp && tmp[1]) || ''
    }

    // Public Key
    if ((tmp = certData.match(/Public[ -]Key: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      certValues.publicKeySize = ((tmp && tmp[1]) || '').replace(/[()]/g, '')
    }

    // Public Key Algorithm
    if ((tmp = certData.match(/Public Key Algorithm: ([^\r\n]*)\r?\n/)) && tmp.length > 1) {
      certValues.publicKeyAlgorithm = (tmp && tmp[1]) || ''
    }

    callback(null, certValues)
  } catch (err) {
    callback(err as Error)
  }
}

function matchAll(str: string, regexp: RegExp): RegExpMatchArray[] | null {
  var matches: any[] = []
  str.replace(regexp, function (): any {
    // eslint-disable-next-line prefer-rest-params -- U5 idiom (e): master's `arguments` use stays verbatim; rest params would change the replacer's runtime shape
    var arr: any = ([]).slice.call(arguments, 0)
    var extras = arr.splice(-2)
    arr.index = extras[0]
    arr.input = extras[1]
    matches.push(arr)
  })
  return matches.length ? matches : null
}

function pregMatchAll(regex: string, haystack: string): string[] {
  var globalRegex = new RegExp(regex, 'g')
  var globalMatch = haystack.match(globalRegex) || []
  var matchArray: string[] = []
  var nonGlobalRegex: RegExp, nonGlobalMatch: RegExpMatchArray | null
  for (var i = 0; i < globalMatch.length; i++) {
    nonGlobalRegex = new RegExp(regex)
    nonGlobalMatch = globalMatch[i].match(nonGlobalRegex)
    matchArray.push((nonGlobalMatch as RegExpMatchArray)[1])
  }
  return matchArray
}

var DNS_LABEL_PATTERN = '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?'
var DNS_NAME_REGEX = new RegExp('^(?:\\*\\.)?' + DNS_LABEL_PATTERN + '(?:\\.' + DNS_LABEL_PATTERN + ')*\\.?$')
var DNS_EMAIL_REGEX = new RegExp('^[A-Za-z0-9.!#$%&\'*+/=?^_`{|}~-]+@' + DNS_LABEL_PATTERN + '(?:\\.' + DNS_LABEL_PATTERN + ')*$')

function isValidDNSName(value: unknown) {
  return typeof value === 'string' && value.length <= 253 && DNS_NAME_REGEX.test(value)
}

function isValidSANEmail(value: unknown) {
  return typeof value === 'string' && value.length <= 254 && DNS_EMAIL_REGEX.test(value)
}

function isValidAltName(value: unknown) {
  return typeof value === 'string' && (net.isIP(value) > 0 || isValidDNSName(value))
}

function generateCSRSubject(options: CreateCSROptions) {
  options = options || {}

  // csrData values are string | string[] | undefined from the option fields;
  // typed any because the else-branch below assumes the non-object shape
  // (master's latent TypeError on empty arrays is preserved verbatim)
  var csrData: Record<string, any> = {
    C: options.country || options.C,
    ST: options.state || options.ST,
    L: options.locality || options.L,
    O: options.organization || options.O,
    OU: options.organizationUnit || options.OU,
    CN: options.commonName || options.CN || 'localhost',
    DC: options.dc || options.DC || '',
    emailAddress: options.emailAddress
  }

  var csrBuilder = Object.keys(csrData).map(function (key) {
    if (csrData[key]) {
      if (typeof csrData[key] === 'object' && csrData[key].length >= 1) {
        var tmpStr = ''
        csrData[key].map(function (o: string) {
          tmpStr += '/' + key + '=' + o.replace(/[^\w\s-!$%^&*()_+|~=`{}[\]:/;<>?,.@#]+/g, ' ').replace('/', '\\/').replace('+', '\\+').trim()
        })
        return tmpStr
      } else {
        return '/' + key + '=' + csrData[key].replace(/[^\w\s-!$%^&*()_+|~=`{}[\]:/;<>?,.@#]+/g, ' ').replace('/', '\\/').replace('+', '\\+').trim()
      }
    }
  })

  return csrBuilder.join('')
}

function readFromString(string: string, start: string, end: string): string[] {
  if (Buffer.isBuffer(string)) {
    string = string.toString('utf8')
  }

  var output: string[] = []

  if (!string) {
    return output
  }

  var offset = string.indexOf(start)

  while (offset !== -1) {
    string = string.substring(offset)

    var endOffset = string.indexOf(end)

    if (endOffset === -1) {
      break
    }

    endOffset += end.length

    output.push(string.substring(0, endOffset))
    offset = string.indexOf(start, endOffset)
  }

  return output
}

// promisify not tested yet
/**
 * Verifies the signing chain of the passed certificate
 * @namespace
 * @name promisified
 * @deprecated Direct function exports now support promises when no callback is provided.
 * @property {function}  createPrivateKey               @see createPrivateKey
 * @property {function}  createDhparam       - The default number of players.
 * @property {function}  createEcparam         - The default level for the party.
 * @property {function}  createCSR      - The default treasure.
 * @property {function}  createCertificate - How much gold the party starts with.
 */
var promisifiedMethods = [
  'createPrivateKey',
  'createDhparam',
  'createEcparam',
  'createCSR',
  'createCertificate',
  'readCertificateInfo',
  'getPublicKey',
  'getFingerprint',
  'getModulus',
  'getDhparamInfo',
  'createPkcs12',
  'readPkcs12',
  'createPkcs8',
  'verifySigningChain',
  'checkCertificate',
  'checkPkcs12'
]
module.exports.promisified = promisifiedMethods.reduce(function (acc: Record<string, (...args: any[]) => Promise<unknown>>, method: string) {
  acc[method] = function () {
    // eslint-disable-next-line prefer-rest-params -- brief: the promisifiedMethods.reduce block stays verbatim; rest params would change the wrapper's runtime shape
    var args: any[] = Array.prototype.slice.call(arguments)
    if (args.length && typeof args[args.length - 1] === 'function') {
      args = args.slice(0, -1)
    }
    return module.exports[method].apply(null, args)
  }
  return acc
}, {})
