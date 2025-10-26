'use strict'

const {randomBytes} = require('crypto')
const fs = require('fs')
const path = require('path')
const {tmpdir} = require('os')
const helper = require('./helper.js')
const openssl = require('./openssl.js')
const pem = require('./pem.js')

const createCSR = pem.createCSR

const DAY_MS = 24 * 60 * 60 * 1000

class CertificateAuthority {
  constructor(options = {}) {
    if (!options.key) {
      throw new Error('CA private key is required')
    }
    if (!options.certificate) {
      throw new Error('CA certificate is required')
    }

    this.key = options.key.toString()
    this.certificate = options.certificate.toString()
    this.password = options.keyPassword || options.password || null
    this.chain = Array.isArray(options.chain) ? options.chain.map(function (value) {
      return value.toString()
    }) : []
    this.defaultDays = Number.isFinite(options.defaultDays) && options.defaultDays > 0 ? Number(options.defaultDays) : 7
  }

  issueCertificate(options, callback) {
    if (!callback && typeof options === 'function') {
      callback = options
      options = undefined
    }

    if (!callback) {
      return new Promise((resolve, reject) => {
        this.issueCertificate(options, function (err, result) {
          if (err) {
            return reject(err)
          }
          resolve(result)
        })
      })
    }

    const issueOptions = Object.assign({}, options || {})

    const handleResult = (err, signResult) => {
      if (err) {
        return callback(err)
      }

      const response = {
        csr: issueOptions.csr,
        clientKey: issueOptions.clientKey || '',
        certificate: signResult.certificate,
        caCertificate: this.certificate,
        caChain: [this.certificate].concat(this.chain),
        serial: signResult.serial,
        validity: signResult.validity
      }

      callback(null, response)
    }

    const signWithOptions = () => {
      this._signCertificate(issueOptions, handleResult)
    }

    if (issueOptions.csr) {
      signWithOptions()
      return
    }

    createCSR(issueOptions, (err, csrData) => {
      if (err) {
        return callback(err)
      }
      issueOptions.csr = csrData.csr
      issueOptions.clientKey = csrData.clientKey
      if (csrData.config) {
        issueOptions.config = csrData.config
      }
      signWithOptions()
    })
  }

  _signCertificate(options, callback) {
    let validity
    try {
      validity = resolveValidity(options, this.defaultDays)
    } catch (err) {
      return callback(err)
    }

    let serial
    try {
      serial = formatSerial(options.serial)
    } catch (err) {
      return callback(err)
    }

    const serialValue = serial.slice(2).toUpperCase() || '1'
    const passwordFiles = []
    let workDir
    let certPath

    try {
      workDir = fs.mkdtempSync(path.join(tmpdir(), 'pem-ca-'))
      fs.mkdirSync(path.join(workDir, 'certs'))
      fs.writeFileSync(path.join(workDir, 'index.txt'), '')
      fs.writeFileSync(path.join(workDir, 'serial'), serialValue + '\n')
      certPath = path.join(workDir, 'issued.pem')
    } catch (err) {
      const cleanupErr = removeDirectory(workDir)
      return callback(cleanupErr || err)
    }

    const configContent = buildCaConfig(workDir, options.hash || 'sha256')

    const params = ['ca',
      '-batch',
      '-config',
      '--TMPFILE--',
      '-keyfile',
      '--TMPFILE--',
      '-cert',
      '--TMPFILE--',
      '-md',
      options.hash || 'sha256',
      '-startdate',
      validity.asn1.start,
      '-enddate',
      validity.asn1.end,
      '-in',
      '--TMPFILE--',
      '-out',
      certPath
    ]

    const tmpfiles = [configContent, this.key, this.certificate, options.csr]

    if (this.password) {
      helper.createPasswordFile({
        cipher: '',
        password: this.password,
        passType: 'in'
      }, params, passwordFiles)
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
    }

    const finalize = (err, certificate) => {
      const removePasswordFiles = (removeErr) => {
        const dirErr = removeDirectory(workDir)
        const finalErr = err || removeErr || dirErr
        if (finalErr) {
          return callback(finalErr)
        }
        callback(null, {
          certificate,
          serial,
          validity: validity.dates
        })
      }

      if (passwordFiles.length) {
        helper.deleteTempFiles(passwordFiles, removePasswordFiles)
      } else {
        removePasswordFiles(null)
      }
    }

    openssl.spawnWrapper(params, tmpfiles, (err) => {
      if (err) {
        return finalize(err)
      }
      let certificate
      try {
        certificate = fs.readFileSync(certPath, 'utf-8')
      } catch (readErr) {
        return finalize(readErr)
      }
      finalize(null, certificate)
    })
  }
}

function buildCaConfig(workDir, digest) {
  const lines = [
    '[ ca ]',
    'default_ca = pem_ca',
    '',
    '[ pem_ca ]',
    'dir = ' + workDir,
    'database = ' + path.join(workDir, 'index.txt'),
    'serial = ' + path.join(workDir, 'serial'),
    'new_certs_dir = ' + path.join(workDir, 'certs'),
    'default_md = ' + digest,
    'policy = pem_ca_policy',
    'x509_extensions = pem_ca_extensions',
    'copy_extensions = copy',
    'unique_subject = no',
    '',
    '[ pem_ca_policy ]',
    'commonName = supplied',
    'stateOrProvinceName = optional',
    'countryName = optional',
    'organizationName = optional',
    'organizationalUnitName = optional',
    'emailAddress = optional',
    '',
    '[ pem_ca_extensions ]',
    'basicConstraints = CA:FALSE',
    'keyUsage = digitalSignature, keyEncipherment',
    'extendedKeyUsage = serverAuth, clientAuth'
  ]

  return lines.join('\n')
}

function removeDirectory(directory) {
  if (!directory) {
    return null
  }

  try {
    fs.rmdirSync(directory, {recursive: true})
    return null
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      return null
    }
    return err
  }
}

function formatSerial(serial) {
  if (serial === undefined || serial === null) {
    return '0x' + randomBytes(20).toString('hex')
  }

  if (Buffer.isBuffer(serial)) {
    return '0x' + serial.toString('hex').padStart(40, '0').slice(-40)
  }

  if (typeof serial === 'number') {
    const hex = serial.toString(16)
    return '0x' + hex.padStart(40, '0').slice(-40)
  }

  let hexSerial
  if (typeof serial === 'string') {
    if (serial.startsWith('0x') || serial.startsWith('0X')) {
      hexSerial = serial.slice(2)
    } else if (helper.isHex(serial)) {
      hexSerial = serial
    } else {
      hexSerial = helper.toHex(serial)
    }
  } else {
    hexSerial = helper.toHex(String(serial))
  }

  hexSerial = (hexSerial || '').replace(/[^0-9a-f]/gi, '')
  if (!hexSerial) {
    throw new Error('Unable to format certificate serial number')
  }

  hexSerial = hexSerial.toLowerCase()
  return '0x' + hexSerial.padStart(40, '0').slice(-40)
}

function resolveValidity(options, defaultDays) {
  const start = normalizeDate(options.startDate) || new Date()
  let end

  if (options.endDate) {
    end = normalizeDate(options.endDate)
  } else if (options.days) {
    const days = Number(options.days)
    if (!Number.isFinite(days) || days <= 0) {
      throw new Error('Certificate validity days must be a positive number')
    }
    end = new Date(start.getTime() + days * DAY_MS)
  } else {
    end = new Date(start.getTime() + defaultDays * DAY_MS)
  }

  if (!end || !(end instanceof Date) || Number.isNaN(end.getTime())) {
    throw new Error('Invalid certificate end date')
  }

  if (end.getTime() <= start.getTime()) {
    throw new Error('Certificate end date must be after start date')
  }

  const startAsn1 = formatAsn1Date(start)
  const endAsn1 = formatAsn1Date(end)

  return {
    asn1: {
      start: startAsn1,
      end: endAsn1
    },
    dates: {
      start: parseAsn1Date(startAsn1),
      end: parseAsn1Date(endAsn1)
    }
  }
}

function normalizeDate(value) {
  if (!value) {
    return null
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Invalid date value')
    }
    return value
  }

  if (typeof value === 'number') {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date value')
    }
    return date
  }

  if (typeof value === 'string') {
    if (/^\d{12}Z$/.test(value) || /^\d{14}Z$/.test(value)) {
      return parseAsn1Date(value)
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new Error('Invalid date string')
    }
    return date
  }

  throw new Error('Unsupported date value')
}

function formatAsn1Date(date) {
  const pad = (num) => {
    let s = String(num)
    while (s.length < 2) {
      s = '0' + s
    }
    return s
  }

  const timePortion = pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds())

  const year = date.getUTCFullYear()
  if (year >= 1950 && year <= 2049) {
    return pad(year % 100) + timePortion + 'Z'
  }

  return year.toString() + timePortion + 'Z'
}

function parseAsn1Date(value) {
  const normalized = value.replace(/\s+/g, '')
  if (!/^\d{12}Z$/.test(normalized) && !/^\d{14}Z$/.test(normalized)) {
    throw new Error('Invalid ASN.1 date value')
  }

  let offset
  let year

  if (normalized.length === 13) { // YYMMDDHHMMSSZ
    const twoDigit = Number(normalized.slice(0, 2))
    year = twoDigit >= 50 ? 1900 + twoDigit : 2000 + twoDigit
    offset = 2
  } else { // YYYYMMDDHHMMSSZ
    year = Number(normalized.slice(0, 4))
    offset = 4
  }

  const month = Number(normalized.slice(offset, offset + 2)) - 1
  const day = Number(normalized.slice(offset + 2, offset + 4))
  const hour = Number(normalized.slice(offset + 4, offset + 6))
  const minute = Number(normalized.slice(offset + 6, offset + 8))
  const second = Number(normalized.slice(offset + 8, offset + 10))
  const date = new Date(Date.UTC(year, month, day, hour, minute, second))
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid ASN.1 date value')
  }
  return date
}

module.exports = CertificateAuthority
