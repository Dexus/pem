export var convert: any;
export namespace promisified {
    const createPrivateKey: any;
    const createDhparam: any;
    const createEcparam: any;
    const createCSR: any;
    const createCertificate: any;
    const readCertificateInfo: any;
    const getPublicKey: any;
    const getFingerprint: any;
    const getModulus: any;
    const getDhparamInfo: any;
    const createPkcs12: any;
    const readPkcs12: any;
    const verifySigningChain: any;
    const checkCertificate: any;
    const checkPkcs12: any;
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
 */
export function createPrivateKey(keyBitsize?: number | undefined, options?: {
    cipher?: string | undefined;
    password?: string | undefined;
} | undefined, callback: Function): void;
/**
 * Creates a dhparam key
 *
 * @static
 * @param {Number} [keyBitsize=512] Size of the key, defaults to 512bit
 * @param {Function} callback Callback function with an error object and {dhparam}
 */
export function createDhparam(keyBitsize?: number | undefined, callback: Function): void;
/**
 * Creates a ecparam key
 * @static
 * @param {String} [keyName=secp256k1] Name of the key, defaults to secp256k1
 * @param {String} [paramEnc=explicit] Encoding of the elliptic curve parameters, defaults to explicit
 * @param {Boolean} [noOut=false] This option inhibits the output of the encoded version of the parameters.
 * @param {Function} callback Callback function with an error object and {ecparam}
 */
export function createEcparam(keyName?: string | undefined, paramEnc?: string | undefined, noOut?: boolean | undefined, callback: Function): void;
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
 */
export function createCSR(options?: {
    clientKey?: string | undefined;
    keyBitsize?: number | undefined;
    hash?: string | undefined;
    country?: string | undefined;
    state?: string | undefined;
    locality?: string | undefined;
    organization?: string | undefined;
    organizationUnit?: string | undefined;
    commonName?: string | undefined;
    emailAddress?: string | undefined;
    csrConfigFile?: string | undefined;
    altNames?: any[] | undefined;
} | undefined, callback: Function): void;
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
 */
export function createCertificate(options?: {
    serviceCertificate?: string | undefined;
    serviceKey?: string | undefined;
    serviceKeyPassword?: string | undefined;
    selfSigned?: boolean | undefined;
    serial?: string | number | undefined;
    serialFile?: string | undefined;
    hash?: string | undefined;
    csr?: string | undefined;
    days?: number | undefined;
    clientKeyPassword?: string | undefined;
    extFile?: string | undefined;
    config?: string | undefined;
    csrConfigFile?: string | undefined;
    altNames?: any[] | undefined;
} | undefined, callback: Function): void;
/**
 * Reads subject data from a certificate or a CSR
 * @static
 * @param {String} certificate PEM encoded CSR or certificate
 * @param {Function} callback Callback function with an error object and {country, state, locality, organization, organizationUnit, commonName, emailAddress}
 */
export function readCertificateInfo(certificate: string, callback: Function): void;
/**
 * Exports a public key from a private key, CSR or certificate
 * @static
 * @param {String} certificate PEM encoded private key, CSR or certificate
 * @param {Function} callback Callback function with an error object and {publicKey}
 */
export function getPublicKey(certificate: string, callback: Function): void;
/**
 * Gets the fingerprint for a certificate
 * @static
 * @param {String} certificate PEM encoded certificate
 * @param {String} [hash] hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha1`)
 * @param {Function} callback Callback function with an error object and {fingerprint}
 */
export function getFingerprint(certificate: string, hash?: string | undefined, callback: Function): void;
/**
 * get the modulus from a certificate, a CSR or a private key
 * @static
 * @param {String} certificate PEM encoded, CSR PEM encoded, or private key
 * @param {String} [password] password for the certificate
 * @param {String} [hash] hash function to use (up to now `md5` supported) (default: none)
 * @param {Function} callback Callback function with an error object and {modulus}
 */
export function getModulus(certificate: string, password?: string | undefined, hash?: string | undefined, callback: Function): void;
/**
 * get the size and prime of DH parameters
 * @static
 * @param {String} dh parameters PEM encoded
 * @param {Function} callback Callback function with an error object and {size, prime}
 */
export function getDhparamInfo(dh: string, callback: Function): void;
/**
 * Export private key and certificate to a PKCS12 keystore
 * @static
 * @param {String} key PEM encoded private key
 * @param {String} certificate PEM encoded certificate
 * @param {String} password Password of the result PKCS12 file
 * @param {Object} [options] object of cipher and optional client key password {cipher:'aes128', clientKeyPassword: 'xxxx', certFiles: ['file1','file2']}
 * @param {Function} callback Callback function with an error object and {pkcs12}
 */
export function createPkcs12(key: string, certificate: string, password: string, options?: Object | undefined, callback: Function): void;
/**
 * read sslcert data from Pkcs12 file. Results are provided in callback response in object notation ({cert: .., ca:..., key:...})
 * @static
 * @param  {Buffer|String}   bufferOrPath Buffer or path to file
 * @param  {Object}   [options]      openssl options
 * @param  {Function} callback     Called with error object and sslcert bundle object
 */
export function readPkcs12(bufferOrPath: Buffer | string, options?: Object | undefined, callback: Function): void;
/**
 * Verifies the signing chain of the passed certificate
 * @static
 * @param {String|Array} certificate PEM encoded certificate include intermediate certificates
 * The correct order of trust chain must be preserved and should start with Leaf
 * certificate. Example array: [Leaf, Int CA 1, ... , Int CA N, Root CA].
 * @param {String|Array} ca [List] of CA certificates
 * @param {Function} callback Callback function with an error object and a boolean valid
 */
export function verifySigningChain(certificate: string | any[], ca: string | any[], callback: Function): void;
/**
 * Check a certificate
 * @static
 * @param {String} certificate PEM encoded certificate
 * @param {String} [passphrase] password for the certificate
 * @param {Function} callback Callback function with an error object and a boolean valid
 */
export function checkCertificate(certificate: string, passphrase?: string | undefined, callback: Function): void;
/**
 * check a PKCS#12 file (.pfx or.p12)
 * @static
 * @param {Buffer|String} bufferOrPath PKCS#12 certificate
 * @param {String} [passphrase] optional passphrase which will be used to open the keystore
 * @param {Function} callback Callback function with an error object and a boolean valid
 */
export function checkPkcs12(bufferOrPath: Buffer | string, passphrase?: string | undefined, callback: Function): void;
/**
 * config the pem module
 * @static
 * @param {Object} options
 */
export function config(options: Object): void;
//# sourceMappingURL=pem.d.ts.map