import {Buffer} from 'node:buffer'

declare namespace pem {
  type Callback<T> = (error: Error | null, result: T) => void

  interface CreatePrivateKeyOptions {
    cipher?: string
    password?: string
  }

  interface PrivateKeyResult {
    key: string
  }

  interface CreateDhparamResult {
    dhparam: string
  }

  interface CreateEcparamResult {
    ecparam: string
  }

  interface CreateCSROptions {
    clientKey?: string | Buffer
    clientKeyPassword?: string
    keyBitsize?: number
    hash?: string
    country?: string
    state?: string
    locality?: string
    organization?: string | string[]
    organizationUnit?: string | string[]
    commonName?: string
    altNames?: Array<string>
    emailAddress?: string
    csrConfigFile?: string
    config?: string
    password?: string
    dc?: string | string[]
    C?: string
    ST?: string
    L?: string
    O?: string | string[]
    OU?: string | string[]
    CN?: string
  }

  interface CSRResult {
    csr: string
    clientKey: string
    config: string | null
  }

  interface CreateCertificateOptions extends CreateCSROptions {
    serviceCertificate?: string | Buffer
    serviceKey?: string | Buffer
    serviceKeyPassword?: string
    selfSigned?: boolean
    serial?: string | number | Buffer
    serialFile?: string
    days?: number
    extFile?: string
    cipher?: string
  }

  interface CertificateCreationResult {
    certificate: string
    csr: string
    clientKey: string
    serviceKey: string
  }

  interface CertificateInfo {
    serial?: string
    country?: string | string[]
    state?: string | string[]
    locality?: string | string[]
    organization?: string | string[]
    organizationUnit?: string | string[]
    commonName?: string | string[]
    emailAddress?: string | string[]
    dc?: string | string[]
    san?: {
      dns?: string[] | ''
      ip?: string[] | ''
      email?: string[] | ''
    }
    validity?: {
      start: number
      end: number
    }
    signatureAlgorithm?: string
    publicKeyAlgorithm?: string
    publicKeySize?: string
    issuer: {
      country?: string | string[]
      state?: string | string[]
      locality?: string | string[]
      organization?: string | string[]
      organizationUnit?: string | string[]
      commonName?: string | string[]
      emailAddress?: string | string[]
      dc?: string | string[]
      [key: string]: string | string[] | undefined
    }
    [key: string]: unknown
  }

  interface FingerprintResult {
    fingerprint: string
  }

  interface PublicKeyResult {
    publicKey: string
  }

  interface ModulusResult {
    modulus: string
  }

  interface DhparamInfoResult {
    size: number
    prime: string
  }

  interface CreatePkcs12Options {
    cipher?: string
    clientKeyPassword?: string
    certFiles?: Array<string>
  }

  interface CreatePkcs12Result {
    pkcs12: Buffer
  }

  interface ReadPkcs12Options {
    p12Password?: string
    clientKeyPassword?: string
  }

  interface ReadPkcs12Result {
    cert?: string
    ca?: string[]
    key?: string
  }

  type CertificateInput = string | Buffer
  type CertificateChainInput = string | Buffer | Array<string | Buffer>

  interface ConvertCertificateBundle {
    cert: string
    ca?: string | string[]
  }

  interface ConvertCertificateKeyBundle extends ConvertCertificateBundle {
    key: string
  }

  interface ConvertModule {
    PEM2DER(pathIn: string, pathOut: string, callback: Callback<boolean>): void
    PEM2DER(pathIn: string, pathOut: string, type: string, callback: Callback<boolean>): void
    DER2PEM(pathIn: string, pathOut: string, callback: Callback<boolean>): void
    DER2PEM(pathIn: string, pathOut: string, type: string, callback: Callback<boolean>): void
    PEM2P7B(bundle: ConvertCertificateBundle, pathOut: string, callback: Callback<boolean>): void
    P7B2PEM(pathIn: string, pathOut: string, callback: Callback<boolean>): void
    PEM2PFX(bundle: ConvertCertificateKeyBundle, pathOut: string, password: string, callback: Callback<boolean>): void
    PFX2PEM(pathIn: string, pathOut: string, password: string, callback: Callback<boolean>): void
  }

  interface IssueCertificateOptions extends CreateCertificateOptions {
    csr?: string | Buffer
    clientKey?: string | Buffer
    chain?: Array<string | Buffer>
    startDate?: Date | number | string
    endDate?: Date | number | string
    days?: number
    serial?: string | number | Buffer
  }

  interface IssuedCertificate {
    csr: string
    clientKey: string
    certificate: string
    caCertificate: string
    caChain: string[]
    serial: string
    validity: {
      start: number
      end: number
    }
  }

  interface CertificateAuthorityOptions {
    key: string | Buffer
    certificate: string | Buffer
    chain?: Array<string | Buffer>
    keyPassword?: string
    password?: string
    defaultDays?: number
  }

  class CA {
    constructor(options: CertificateAuthorityOptions)
    issueCertificate(options?: IssueCertificateOptions): Promise<IssuedCertificate>
    issueCertificate(callback: Callback<IssuedCertificate>): void
    issueCertificate(options: IssueCertificateOptions, callback: Callback<IssuedCertificate>): void
  }

  interface Promisified {
    createPrivateKey(): Promise<PrivateKeyResult>
    createPrivateKey(keyBitsize: number): Promise<PrivateKeyResult>
    createPrivateKey(options: CreatePrivateKeyOptions): Promise<PrivateKeyResult>
    createPrivateKey(keyBitsize: number, options: CreatePrivateKeyOptions): Promise<PrivateKeyResult>
    createDhparam(keyBitsize?: number): Promise<CreateDhparamResult>
    createEcparam(keyName?: string, paramEnc?: string, noOut?: boolean): Promise<CreateEcparamResult>
    createCSR(options?: CreateCSROptions): Promise<CSRResult>
    createCertificate(options?: CreateCertificateOptions): Promise<CertificateCreationResult>
    readCertificateInfo(certificate?: CertificateInput): Promise<CertificateInfo>
    getPublicKey(certificate?: CertificateInput): Promise<PublicKeyResult>
    getFingerprint(certificate: CertificateInput, hash?: string): Promise<FingerprintResult>
    getModulus(certificate: CertificateInput, password?: string, hash?: string | false): Promise<ModulusResult>
    getDhparamInfo(dh: CertificateInput): Promise<DhparamInfoResult>
    createPkcs12(key: string | Buffer, certificate: string | Buffer, password: string, options?: CreatePkcs12Options): Promise<CreatePkcs12Result>
    readPkcs12(bufferOrPath: Buffer | string, options?: ReadPkcs12Options): Promise<ReadPkcs12Result>
    verifySigningChain(certificate: CertificateChainInput, ca?: CertificateChainInput): Promise<boolean>
    checkCertificate(certificate: CertificateInput, passphrase?: string): Promise<boolean>
    checkPkcs12(bufferOrPath: Buffer | string, passphrase?: string): Promise<boolean>
  }

  interface PemModule {
    createPrivateKey(keyBitsize: number, options: CreatePrivateKeyOptions, callback: Callback<PrivateKeyResult>): void
    createPrivateKey(keyBitsize: number, callback: Callback<PrivateKeyResult>): void
    createPrivateKey(options: CreatePrivateKeyOptions, callback: Callback<PrivateKeyResult>): void
    createPrivateKey(callback: Callback<PrivateKeyResult>): void
    createPrivateKey(keyBitsize?: number, options?: CreatePrivateKeyOptions): Promise<PrivateKeyResult>

    createDhparam(keyBitsize: number, callback: Callback<CreateDhparamResult>): void
    createDhparam(callback: Callback<CreateDhparamResult>): void
    createDhparam(keyBitsize?: number): Promise<CreateDhparamResult>

    createEcparam(keyName: string, paramEnc: string, noOut: boolean, callback: Callback<CreateEcparamResult>): void
    createEcparam(keyName: string, paramEnc: string, callback: Callback<CreateEcparamResult>): void
    createEcparam(keyName: string, callback: Callback<CreateEcparamResult>): void
    createEcparam(callback: Callback<CreateEcparamResult>): void
    createEcparam(keyName?: string, paramEnc?: string, noOut?: boolean): Promise<CreateEcparamResult>

    createCSR(options: CreateCSROptions, callback: Callback<CSRResult>): void
    createCSR(callback: Callback<CSRResult>): void
    createCSR(options?: CreateCSROptions): Promise<CSRResult>

    createCertificate(options: CreateCertificateOptions, callback: Callback<CertificateCreationResult>): void
    createCertificate(callback: Callback<CertificateCreationResult>): void
    createCertificate(options?: CreateCertificateOptions): Promise<CertificateCreationResult>

    readCertificateInfo(certificate: CertificateInput, callback: Callback<CertificateInfo>): void
    readCertificateInfo(callback: Callback<CertificateInfo>): void
    readCertificateInfo(certificate?: CertificateInput): Promise<CertificateInfo>

    getPublicKey(certificate: CertificateInput, callback: Callback<PublicKeyResult>): void
    getPublicKey(callback: Callback<PublicKeyResult>): void
    getPublicKey(certificate?: CertificateInput): Promise<PublicKeyResult>

    getFingerprint(certificate: CertificateInput, hash: string, callback: Callback<FingerprintResult>): void
    getFingerprint(certificate: CertificateInput, callback: Callback<FingerprintResult>): void
    getFingerprint(certificate: CertificateInput, hash?: string): Promise<FingerprintResult>

    getModulus(certificate: CertificateInput, password: string, hash: string | false, callback: Callback<ModulusResult>): void
    getModulus(certificate: CertificateInput, password: string, callback: Callback<ModulusResult>): void
    getModulus(certificate: CertificateInput, callback: Callback<ModulusResult>): void
    getModulus(certificate: CertificateInput, password?: string, hash?: string | false): Promise<ModulusResult>

    getDhparamInfo(dh: CertificateInput, callback: Callback<DhparamInfoResult>): void
    getDhparamInfo(dh: CertificateInput): Promise<DhparamInfoResult>

    createPkcs12(key: string | Buffer, certificate: string | Buffer, password: string, options: CreatePkcs12Options, callback: Callback<CreatePkcs12Result>): void
    createPkcs12(key: string | Buffer, certificate: string | Buffer, password: string, callback: Callback<CreatePkcs12Result>): void
    createPkcs12(key: string | Buffer, certificate: string | Buffer, password: string, options?: CreatePkcs12Options): Promise<CreatePkcs12Result>

    readPkcs12(bufferOrPath: Buffer | string, options: ReadPkcs12Options, callback: Callback<ReadPkcs12Result>): void
    readPkcs12(bufferOrPath: Buffer | string, callback: Callback<ReadPkcs12Result>): void
    readPkcs12(bufferOrPath: Buffer | string, options?: ReadPkcs12Options): Promise<ReadPkcs12Result>

    verifySigningChain(certificate: CertificateChainInput, ca: CertificateChainInput, callback: Callback<boolean>): void
    verifySigningChain(certificate: CertificateChainInput, callback: Callback<boolean>): void
    verifySigningChain(certificate: CertificateChainInput, ca?: CertificateChainInput): Promise<boolean>

    checkCertificate(certificate: CertificateInput, passphrase: string, callback: Callback<boolean>): void
    checkCertificate(certificate: CertificateInput, callback: Callback<boolean>): void
    checkCertificate(certificate: CertificateInput, passphrase?: string): Promise<boolean>

    checkPkcs12(bufferOrPath: Buffer | string, passphrase: string, callback: Callback<boolean>): void
    checkPkcs12(bufferOrPath: Buffer | string, callback: Callback<boolean>): void
    checkPkcs12(bufferOrPath: Buffer | string, passphrase?: string): Promise<boolean>

    config(options: Record<string, string | number | boolean>): void

    convert: ConvertModule
    CA: typeof CA
    promisified: Promisified
  }
}

declare const pem: pem.PemModule

export = pem
