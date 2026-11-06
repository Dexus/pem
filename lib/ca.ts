'use strict'

const {randomBytes} = require('crypto')
import fs = require('fs')
import path = require('path')
const {tmpdir} = require('os')
import helper = require('./helper')
import openssl = require('./openssl')
const pem = require('./pem')

const createCSR = pem.createCSR

const DAY_MS = 24 * 60 * 60 * 1000

interface CAConstructorOptions {
  key?: string | Buffer
  certificate?: string | Buffer
  keyPassword?: string
  password?: string
  chain?: Array<string | Buffer>
  defaultDays?: number
}

interface IssueCertificateOptions {
  csr?: string
  clientKey?: string
  clientKeyPassword?: string
  serial?: string | number | Buffer
  hash?: string
  copyExtensions?: boolean
  config?: string
  extFile?: string
  profile?: ExtensionProfileName
  startDate?: Date | number | string
  endDate?: Date | number | string
  notBefore?: Date | number | string
  notAfter?: Date | number | string
  days?: number
  keyBitsize?: number
  country?: string
  state?: string
  locality?: string
  organization?: string | string[]
  organizationUnit?: string | string[]
  commonName?: string
  altNames?: string[]
  emailAddress?: string
  csrConfigFile?: string
  password?: string
  dc?: string | string[]
  C?: string
  ST?: string
  L?: string
  O?: string | string[]
  OU?: string | string[]
  CN?: string
  /** @internal SAN config generated internally from altNames (never caller-owned config) */
  generatedSanConfig?: string | null
}

interface IssueResult {
  csr: string | undefined
  clientKey: string
  certificate: string
  caCertificate: string
  caChain: string[]
  serial: string
  validity: { start: Date; end: Date }
}

type IssueCallback = (err?: Error | null, result?: IssueResult) => void

interface CreateCAOptions extends IssueCertificateOptions {
  CA?: boolean
  selfSigned?: boolean
  keyPassword?: string
  defaultDays?: number
}

interface CreateIntermediateCAOptions extends IssueCertificateOptions {
  pathlen?: number
  defaultDays?: number
}

type CACallback = (err?: Error | string | null, ca?: CertificateAuthority) => void

// secure prepared extension profiles for issued certificates: the CA keeps
// basicConstraints at CA:FALSE for every profile, only keyUsage and
// extendedKeyUsage change with the intended purpose
const EXTENSION_PROFILES = {
  server: {
    keyUsage: 'digitalSignature, keyEncipherment',
    extKeyUsage: 'serverAuth'
  },
  client: {
    keyUsage: 'digitalSignature, keyEncipherment',
    extKeyUsage: 'clientAuth'
  },
  codeSigning: {
    keyUsage: 'digitalSignature',
    extKeyUsage: 'codeSigning'
  }
}

type ExtensionProfileName = keyof typeof EXTENSION_PROFILES

class CertificateAuthority {
  declare key: string
  declare certificate: string
  declare password: string | null
  declare chain: string[]
  declare defaultDays: number
  declare caValidity: {start: Date; end: Date} | null

  constructor(options: CAConstructorOptions = {}) {
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
    this.defaultDays = Number.isFinite(options.defaultDays) && (options.defaultDays as number) > 0 ? Number(options.defaultDays) : 7
    this.caValidity = null
  }

  /**
   * Creates a self-signed CA certificate with its own private key in a single
   * call and returns a ready-to-use CertificateAuthority for issuing
   * certificates from it. The certificate gets the CA:TRUE basicConstraints
   * and defaults to a 10 year validity (pass `days` to override), so issued
   * certificates can use explicit startdate/enddate windows inside it
   * (issue #30).
   * @static
   * @param {Object} [options] Optional options object, see createCertificate for subject/serial options
   * @param {Number} [options.days] Validity of the CA certificate in days (defaults to 3650)
   * @param {Number} [options.defaultDays] Default validity in days used by the returned CA when issuing certificates
   * @param {String} [options.keyPassword] Password for using the generated CA key later
   * @param {Function} [callback] Callback function with an error object and a CertificateAuthority instance
   * @returns {Promise<CertificateAuthority>|undefined} Resolves with the CertificateAuthority when no callback is provided.
   */
  static createCA(options: CreateCAOptions | CACallback | undefined, callback?: CACallback): Promise<CertificateAuthority> | void {
    if (!callback && typeof options === 'function') {
      callback = options
      options = undefined
    }

    if (!callback) {
      return new Promise<CertificateAuthority>((resolve, reject) => {
        CertificateAuthority.createCA(options, (err?: Error | string | null, ca?: CertificateAuthority) => {
          if (err) {
            return reject(err)
          }
          resolve(ca as CertificateAuthority)
        })
      })
    }

    const caOptions = Object.assign({}, options || {}) as CreateCAOptions
    caOptions.CA = true
    caOptions.selfSigned = true
    if (!caOptions.days) {
      caOptions.days = 3650
    }
    if (caOptions.csr && !caOptions.config) {
      // a submitted CSR bypasses CSR generation, where CA:true is normally
      // turned into an extension config; provide the secure root CA
      // extensions ourselves so the "CA" really is one
      caOptions.config = [
        '[req]',
        'req_extensions = v3_req',
        'distinguished_name = req_distinguished_name',
        '[req_distinguished_name]',
        'commonName = Common Name',
        'commonName_max = 64',
        '[v3_req]',
        'basicConstraints = critical,CA:TRUE',
        'keyUsage = critical,keyCertSign,cRLSign',
        'subjectKeyIdentifier = hash'
      ].join('\n')
    }
    const keyPassword = caOptions.keyPassword || caOptions.clientKeyPassword || caOptions.password || null
    delete caOptions.keyPassword
    if (keyPassword && !caOptions.clientKeyPassword) {
      // forward the passphrase so the generated CA private key is really
      // encrypted — createCertificate encrypts the key it generates with
      // clientKeyPassword, and signing needs the same passphrase again
      caOptions.clientKeyPassword = keyPassword
    }

    pem.createCertificate(caOptions, (error: Error | string | null, result?: { certificate: string; serviceKey: string }) => {
      if (error) {
        return callback(error as Error)
      }
      callback(null, new CertificateAuthority({
        key: (result as { serviceKey: string }).serviceKey,
        certificate: (result as { certificate: string }).certificate,
        keyPassword: keyPassword as string,
        defaultDays: caOptions.defaultDays
      }))
    })
  }

  /**
   * Issues an intermediate CA certificate from this authority and returns a
   * ready-to-use CertificateAuthority bound to it. The intermediate gets the
   * secure prepared CA extensions (critical CA:TRUE with optional pathlen,
   * keyCertSign/cRLSign, subjectKeyIdentifier and authorityKeyIdentifier) and
   * cannot be overridden through config, extFile or profile — use
   * issueCertificate with your own config when you need full control.
   * Without explicit dates the intermediate uses the parent's whole remaining
   * validity window, so the issued-validity guard never blocks leaf issuance.
   * @param {Object} [options] Optional options object, see issueCertificate for subject/serial/date options
   * @param {Number} [options.pathlen] Maximum number of non-self-issued intermediate CAs allowed below this one (RFC 5280 pathLenConstraint)
   * @param {Number} [options.defaultDays] Default validity in days used by the returned intermediate when issuing certificates
   * @param {Function} [callback] Callback function with an error object and a CertificateAuthority instance
   * @returns {Promise<CertificateAuthority>|undefined} Resolves with the intermediate CertificateAuthority when no callback is provided.
   */
  createIntermediateCA(options?: CreateIntermediateCAOptions | CACallback, callback?: CACallback): Promise<CertificateAuthority> | void {
    if (!callback && typeof options === 'function') {
      callback = options
      options = undefined
    }

    if (!callback) {
      return new Promise<CertificateAuthority>((resolve, reject) => {
        this.createIntermediateCA(options, (err?: Error | string | null, ca?: CertificateAuthority) => {
          if (err) {
            return reject(err)
          }
          resolve(ca as CertificateAuthority)
        })
      })
    }

    const intOptions = Object.assign({}, options || {}) as CreateIntermediateCAOptions
    if (intOptions.config || intOptions.extFile || intOptions.profile) {
      return callback(new Error('createIntermediateCA defines its own secure extensions; config, extFile and profile are not allowed here'))
    }
    if (intOptions.csr && !intOptions.clientKey) {
      return callback(new Error('issuing an intermediate CA from a CSR requires its private key (clientKey): the returned authority needs the key to sign certificates'))
    }
    const pathlen = intOptions.pathlen
    if (pathlen !== undefined && (!Number.isInteger(pathlen) || pathlen < 0)) {
      return callback(new Error('pathlen must be a non-negative integer'))
    }

    // the secure prepared config for the authority: a real CA certificate
    // with keyCertSign/cRLSign only, plus SKI/AKI for clean chain building
    intOptions.config = [
      '[req]',
      'req_extensions = v3_req',
      'distinguished_name = req_distinguished_name',
      '[req_distinguished_name]',
      'commonName = Common Name',
      'commonName_max = 64',
      '[v3_req]',
      'basicConstraints = critical,CA:TRUE' + (pathlen === undefined ? '' : ',pathlen:' + pathlen),
      'keyUsage = critical,keyCertSign,cRLSign',
      'subjectKeyIdentifier = hash',
      'authorityKeyIdentifier = keyid,issuer'
    ].join('\n')

    const finish = (err?: Error | null, issued?: IssueResult) => {
      if (err) {
        return callback(err as Error)
      }
      callback(null, new CertificateAuthority({
        key: (issued as { clientKey: string }).clientKey,
        certificate: (issued as { certificate: string }).certificate,
        chain: [this.certificate].concat(this.chain),
        keyPassword: intOptions.clientKeyPassword || intOptions.password || undefined,
        defaultDays: intOptions.defaultDays
      }))
    }

    if (intOptions.days || intOptions.notAfter || intOptions.endDate) {
      this.issueCertificate(intOptions, finish)
      return
    }

    // default to the parent's whole remaining validity so issued leaf
    // certificates never reach outside the intermediate window either
    this._getCAValidity((err: Error | null, caValidity?: {start: Date; end: Date}) => {
      if (err) {
        return finish(err)
      }
      intOptions.notAfter = (caValidity as {start: Date; end: Date}).end
      this.issueCertificate(intOptions, finish)
    })
  }

  issueCertificate(options?: IssueCertificateOptions | IssueCallback, callback?: IssueCallback) {
    if (!callback && typeof options === 'function') {
      callback = options
      options = undefined
    }

    if (!callback) {
      return new Promise<IssueResult | undefined>((resolve, reject) => {
        this.issueCertificate(options, function (err, result) {
          if (err) {
            return reject(err)
          }
          resolve(result)
        })
      })
    }

    const issueOptions = Object.assign({}, options || {}) as IssueCertificateOptions

    const handleResult = (err: Error | null, signResult: any) => {
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

    createCSR(issueOptions, (err: Error | null, csrData: { csr: string; clientKey: string; config: string | null }) => {
      if (err) {
        return callback(err)
      }
      issueOptions.csr = csrData.csr
      issueOptions.clientKey = csrData.clientKey
      if (csrData.config) {
        // keep generated SAN config separate from caller-owned options.config:
        // merging it into config would replace a caller's extensions (or a
        // secure intermediate config) and would wrongly trip the profile
        // conflict check; _signCertificate merges the alt_names block instead
        issueOptions.generatedSanConfig = csrData.config
      }
      signWithOptions()
    })
  }

  _getCAValidity(callback: (err: Error | null, validity?: {start: Date; end: Date}) => void) {
    if (this.caValidity) {
      return callback(null, this.caValidity)
    }
    pem.readCertificateInfo(this.certificate, (err: Error | null, info: { validity?: { start?: number; end?: number } }) => {
      if (err) {
        return callback(new Error('Unable to read the CA certificate: ' + err.message))
      }
      if (!info || !info.validity || !info.validity.start || !info.validity.end) {
        return callback(new Error('Unable to read the validity of the CA certificate'))
      }
      this.caValidity = {
        start: new Date(info.validity.start),
        end: new Date(info.validity.end)
      }
      callback(null, this.caValidity)
    })
  }

  _signCertificate(options: IssueCertificateOptions, callback: (err: Error | null, result?: { certificate: string; serial: string; validity: { start: Date; end: Date } }) => void) {
    const proceed = (caValidity: {start: Date; end: Date}) => {
      let validity: { asn1: {start: string; end: string}, dates: {start: Date; end: Date} }
      try {
        validity = resolveValidity(options, this.defaultDays)
        // a CA must not issue certificates it knows can never verify: the
        // requested window has to sit inside the CA certificate's own
        // validity window (openssl ca would silently accept either way)
        assertValidityInsideCA(validity.dates, caValidity)
        const profile = options.profile
        if (profile && !Object.prototype.hasOwnProperty.call(EXTENSION_PROFILES, profile)) {
          throw new Error('Unknown certificate profile "' + profile + '" — expected one of: ' +
            Object.keys(EXTENSION_PROFILES).join(', '))
        }
        if (profile && (options.config || options.extFile)) {
          throw new Error('The profile option cannot be combined with config or extFile: the profile defines the extensions itself')
        }
      } catch (err) {
        return callback(err as Error)
      }

    let serial: string
    try {
      serial = formatSerial(options.serial)
    } catch (err) {
      return callback(err as Error)
    }

    const serialValue = serial.slice(2).toUpperCase() || '1'
    const passwordFiles: string[] = []
    let workDir: string | undefined
    let certPath: string | undefined

    try {
      workDir = fs.mkdtempSync(path.join(tmpdir(), 'pem-ca-'))
      fs.mkdirSync(path.join(workDir, 'certs'))
      fs.writeFileSync(path.join(workDir, 'index.txt'), '')
      fs.writeFileSync(path.join(workDir, 'serial'), serialValue + '\n')
      certPath = path.join(workDir, 'issued.pem')
    } catch (err) {
      const cleanupErr = removeDirectory(workDir)
      return callback(cleanupErr || (err as Error))
    }

    const configContent = buildCaConfig(workDir, options.hash || 'sha256', options.copyExtensions, options.profile as ExtensionProfileName | undefined)

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
      certPath as string
    ]

    const tmpfiles = [configContent, this.key, this.certificate, options.csr as string]

    if (this.password) {
      helper.createPasswordFile({
        cipher: '',
        password: this.password,
        passType: 'in'
      }, params, passwordFiles)
    }

    const altNamesLines = options.generatedSanConfig ? extractAltNamesSection(options.generatedSanConfig) : null

    if (options.config) {
      // caller-owned config keeps authority over the extension section; a
      // generated SAN block (from the altNames of our own CSR) is merged in
      params.push('-extensions')
      params.push('v3_req')
      params.push('-extfile')
      params.push('--TMPFILE--')
      tmpfiles.push(altNamesLines ? mergeAltNamesIntoConfig(options.config as string, altNamesLines) : options.config as string)
    } else if (options.extFile) {
      // caller-owned extension file: the caller owns the extensions entirely
      params.push('-extfile')
      params.push(options.extFile as string)
    } else if (altNamesLines) {
      // no caller extensions: emit the CA-controlled floor (basicConstraints,
      // profile keyUsage/EKU) plus the generated SAN block
      params.push('-extensions')
      params.push('v3_req')
      params.push('-extfile')
      params.push('--TMPFILE--')
      tmpfiles.push(buildExtensionFile(options.profile as ExtensionProfileName | undefined, altNamesLines))
    }

    const finalize = (err: Error | null, certificate?: any) => {
      const removePasswordFiles = (removeErr: NodeJS.ErrnoException | null) => {
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
          certificate = fs.readFileSync(certPath as string, 'utf-8')
        } catch (readErr) {
          return finalize(readErr as Error)
        }
        finalize(null, certificate)
      })
    }

    this._getCAValidity((err: Error | null, caValidity?: {start: Date; end: Date}) => {
      if (err) {
        return callback(err)
      }
      proceed(caValidity as {start: Date; end: Date})
    })
  }
}

function buildCaConfig(workDir: string, digest: string, copyExtensions: boolean | undefined, profile?: ExtensionProfileName): string {
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
    'x509_extensions = pem_ca_extensions'
  ]

  // Extensions from a submitted CSR are untrusted input: only copy them into
  // the issued certificate when explicitly requested. Everything else stays
  // CA-controlled through pem_ca_extensions above (GHSA-445w-cp49-3x4p)
  if (copyExtensions) {
    lines.push('copy_extensions = copy')
  }

  const usage = profile ? EXTENSION_PROFILES[profile] : {
    keyUsage: 'digitalSignature, keyEncipherment',
    extKeyUsage: 'serverAuth, clientAuth'
  }

  lines.push(
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
    'keyUsage = ' + usage.keyUsage,
    'extendedKeyUsage = ' + usage.extKeyUsage
  )

  return lines.join('\n')
}

function extractAltNamesSection(configContent: string): string[] | null {
  const lines = configContent.split('\n')
  const start = lines.findIndex(function (line) {
    return line.trim().toLowerCase() === '[alt_names]'
  })
  if (start === -1) {
    return null
  }
  const section: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    if (/^\s*\[/.test(lines[i])) {
      break
    }
    if (lines[i].trim()) {
      section.push(lines[i].trim())
    }
  }
  return section.length ? section : null
}

function mergeAltNamesIntoConfig(configContent: string, altNamesLines: string[]): string {
  const lines = configContent.split('\n')
  const v3 = lines.findIndex(function (line) {
    return line.trim().toLowerCase() === '[v3_req]'
  })
  if (v3 === -1) {
    return configContent.replace(/\n*$/, '\n') +
      '[v3_req]\nsubjectAltName = @alt_names\n[alt_names]\n' + altNamesLines.join('\n') + '\n'
  }
  let insertAt = lines.length
  let hasSan = false
  for (let i = v3 + 1; i < lines.length; i++) {
    if (/^\s*\[/.test(lines[i])) {
      insertAt = i
      break
    }
    if (/^\s*#/.test(lines[i])) {
      continue
    }
    if (/^\s*subjectAltName\s*=/i.test(lines[i])) {
      hasSan = true
    }
  }
  const merged = lines.slice()
  if (!hasSan) {
    merged.splice(insertAt, 0, 'subjectAltName = @alt_names')
  }
  merged.push('', '[alt_names]', altNamesLines.join('\n'))
  return merged.join('\n')
}

function buildExtensionFile(profile: ExtensionProfileName | undefined, altNamesLines: string[]): string {
  const usage = profile ? EXTENSION_PROFILES[profile] : {
    keyUsage: 'digitalSignature, keyEncipherment',
    extKeyUsage: 'serverAuth, clientAuth'
  }
  const lines = [
    '[v3_req]',
    'basicConstraints = CA:FALSE',
    'keyUsage = ' + usage.keyUsage,
    'extendedKeyUsage = ' + usage.extKeyUsage,
    'subjectAltName = @alt_names',
    '[alt_names]',
    altNamesLines.join('\n')
  ]
  return lines.join('\n')
}

function removeDirectory(directory?: string): NodeJS.ErrnoException | null {
  if (!directory) {
    return null
  }

  try {
    fs.rmSync(directory, {recursive: true})
    return null
  } catch (err) {
    if (err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null
    }
    return err as NodeJS.ErrnoException
  }
}

function formatSerial(serial: string | Buffer | number | undefined | null) {
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

function assertValidityInsideCA(validity: {start: Date; end: Date}, caValidity: {start: Date; end: Date}) {
  if (validity.start.getTime() < caValidity.start.getTime()) {
    throw new Error('Certificate start date ' + validity.start.toISOString() +
      ' is before the CA certificate becomes valid (' + caValidity.start.toISOString() + ')')
  }
  if (validity.end.getTime() > caValidity.end.getTime()) {
    throw new Error('Certificate end date ' + validity.end.toISOString() +
      ' is after the CA certificate expires (' + caValidity.end.toISOString() + ')')
  }
}

function resolveValidity(options: IssueCertificateOptions, defaultDays: number) {
  // notBefore/notAfter are the X.509 names and take precedence over their
  // startDate/endDate aliases
  const start = normalizeDate(options.notBefore || options.startDate) || new Date()
  let end: Date | null

  if (options.notAfter || options.endDate) {
    end = normalizeDate(options.notAfter || options.endDate)
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

function normalizeDate(value: Date | number | string | undefined | null) {
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

function formatAsn1Date(date: Date) {
  const pad = (num: number) => {
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

function parseAsn1Date(value: string) {
  const normalized = value.replace(/\s+/g, '')
  if (!/^\d{12}Z$/.test(normalized) && !/^\d{14}Z$/.test(normalized)) {
    throw new Error('Invalid ASN.1 date value')
  }

  let offset: number
  let year: number

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

export = CertificateAuthority
