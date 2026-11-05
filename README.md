pem
===

Create private keys and certificates with node.js

[![npm version](https://badge.fury.io/js/pem.svg)](http://badge.fury.io/js/pem) [![npm downloads](https://img.shields.io/npm/dt/pem.svg)](https://www.npmjs.com/package/pem) [![pem documentation](https://img.shields.io/badge/pem-documentation-0099ff.svg?style=flat)](https://dexus.github.io/pem/jsdoc/)

[![JavaScript Style Guide](https://cdn.rawgit.com/standard/standard/master/badge.svg)](https://github.com/standard/standard)

## Installation

Install with npm

    npm install pem

or use yarn

    yarn add pem

:warning: Please make sure you have `openssl` or `libressl` already installed on your system/container, without
them `pem` will not work.

**Supported library versions:** OpenSSL 1.1.1 or newer (including the 3.x and 4.x release
lines) and LibreSSL 3.0 or newer. The CI matrix tests the latest patch release of every
supported release line; OpenSSL ≤ 1.1.0 and LibreSSL 2.x are no longer tested and may not work.

## TypeScript

TypeScript declaration files are bundled with the package via `types/pem.d.ts`. The public API, including the legacy `promisified` helpers and the `CA` utility, now has precise typings.

Run `yarn test:types` to execute the lightweight [tsd](https://github.com/SamVerschueren/tsd) assertions that guard the definitions.

## Breaking changes in 2.0.0

2.0.0 hardens `pem` against configuration injection and denial of service. Two behavior changes are breaking:

  * **altNames are validated.** Every entry in the `altNames` option of `createCSR` (and therefore `createCertificate` and the `CA` utility) must be a valid DNS hostname (RFC 1123, optionally wildcarded like `*.example.com`, optional trailing dot) or an IP address. Anything else — including OpenSSL config syntax such as `$ENV::VAR` references or embedded newlines — is rejected with an error instead of being written into the generated OpenSSL config file. A trailing dot in a DNS entry is accepted but stripped in the generated configuration: RFC 5280 dNSName values carry no trailing label separator, and strict verifiers (LibreSSL ≥ 3.5) reject one.
  * **CSR extensions are no longer copied into issued certificates by default.** Previously the SANs of a submitted CSR were silently transferred to the certificate `createCertificate` issued and `issueCertificate` signed, so an untrusted CSR could vouch for hostnames it does not own. Pass the new `copyExtensions: true` option to restore the old behavior for CSRs you trust. Even then, every SAN value is validated and the CA utility keeps its own `basicConstraints`/`keyUsage`/`extendedKeyUsage` floor, so a CSR can never promote itself to a CA certificate.

If you relied on the old behavior, audit where your CSRs come from before enabling `copyExtensions`.


## Examples

Here are some examples for creating an SSL key/cert on the fly, and running an HTTPS server on port 443. 443 is the
standard HTTPS port, but requires root permissions on most systems. To get around this, you could use a higher port
number, like 4300, and use https://localhost:4300 to access your server.

> **Promise support:** Every asynchronous function in `pem` still accepts a Node-style callback and now returns a
> `Promise` when no callback is provided. The legacy `pem.promisified` helper is deprecated; use the primary exports
> directly for both callback and promise flows.

### Basic https

```javascript
var https = require('https')
var pem = require('pem')

pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  https.createServer({ key: keys.clientKey, cert: keys.certificate }, function (req, res) {
    res.end('o hai!')
  }).listen(443)
})
```

###  Express
```javascript
var https = require('https')
var pem = require('pem')
var express = require('express')

pem.createCertificate({ days: 1, selfSigned: true }, function (err, keys) {
  if (err) {
    throw err
  }
  var app = express()

  app.get('/', function (req, res) {
    res.send('o hai!')
  })

  https.createServer({ key: keys.clientKey, cert: keys.certificate }, app).listen(443)
})
```

### Basic https with async/await

```javascript
const https = require('https')
const pem = require('pem')

async function main() {
  const keys = await pem.createCertificate({ days: 1, selfSigned: true })

  const server = https.createServer({ key: keys.clientKey, cert: keys.certificate }, (req, res) => {
    res.end('o hai!')
  })

  server.listen(443)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

## API
Please have a look into the [API documentation](https://dexus.github.io/pem/jsdoc/).

All asynchronous functions document below support both callback and promise styles. Invoke them without a callback to
receive a `Promise` that resolves to the same value that would be passed to the callback.

_we had to clean up a bit_
<!--
### Create a dhparam key

Use `createDhparam` for creating dhparam keys

    pem.createDhparam(keyBitsize, callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 512 (bit)
  * **callback** is a callback function with an error object and `{dhparam}`

### Create a ecparam key

Use `createEcparam` for creating ecparam keys

    pem.createEcparam(keyName, callback)

Where

  * **keyName** is an optional name of the key curves name, defaults to secp256k1
  * **callback** is a callback function with an error object and `{ecparam}`

### Create a private key

Use `createPrivateKey` for creating private keys

    pem.createPrivateKey(keyBitsize, [options,] callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 2048 (bit)
  * **options** is an optional object of the cipher and password (both required for encryption), defaults {cipher:'',password:''}
  (ciphers:["aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3", "idea"])
  * **callback** is a callback function with an error object and `{key}`

### Create a Certificate Signing Request

Use `createCSR` for creating certificate signing requests

    pem.createCSR(options, callback)

Where

  * **options** is an optional options object
  * **callback** is a callback function with an error object and `{csr, clientKey}`

Possible options are the following

  * **clientKey** is an optional client key to use
  * **clientKeyPassword** the optional password for `clientKey`
  * **keyBitsize** - if `clientKey` is undefined, bit size to use for generating a new key (defaults to 2048)
  * **hash** is a hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha256`)
  * **country** is a CSR country field
  * **state** is a CSR state field
  * **locality** is a CSR locality field
  * **organization** is a CSR organization field
  * **organizationUnit** is a CSR organizational unit field
  * **commonName** is a CSR common name field (defaults to `localhost`)
  * **altNames** is a list (`Array`) of subjectAltNames in the subjectAltName field (optional). Since 2.0.0 every entry must be a valid DNS hostname or IP address; invalid entries are rejected with an error
  * **emailAddress** is a CSR email address field
  * **csrConfigFile** is a CSR config file

### Create a certificate

Use `createCertificate` for creating private keys

    pem.createCertificate(options, callback)

Where

  * **options** is an optional options object
  * **callback** is a callback function with an error object and `{certificate, csr, clientKey, serviceKey}`

Possible options include all the options for `createCSR` - in case `csr` parameter is not defined and a new
CSR needs to be generated.

In addition, possible options are the following

  * **serviceKey** is a private key for signing the certificate, if not defined a new one is generated
  * **serviceKeyPassword** Password of the service key
  * **serviceCertificate** is the optional certificate for the `serviceKey`
  * **serial** is the unique serial number for the signed certificate, required if `serviceCertificate` is defined
  * **selfSigned** - if set to true and `serviceKey` is not defined, use `clientKey` for signing
  * **csr** is a CSR for the certificate, if not defined a new one is generated
  * **days** is the certificate expire time in days
  * **extFile** extension config file - **without** `-extensions v3_req`
  * **config** extension config file - **with** `-extensions v3_req`
  * **copyExtensions** copy the SAN entries of a submitted `csr` into the issued certificate (defaults to `false` since 2.0.0). Only enable this for CSRs you trust; copied DNS/IP/email values are validated and issuance fails on invalid ones. `config`/`extFile` take precedence when provided

### Export a public key

Use `getPublicKey` for exporting a public key from a private key, CSR or certificate

    pem.getPublicKey(certificate, callback)

Where

  * **certificate** is a PEM encoded private key, CSR or certificate
  * **callback** is a callback function with an error object and `{publicKey}`

### Read certificate info

Use `readCertificateInfo` for reading subject data from a certificate or a CSR

    pem.readCertificateInfo(certificate, callback)

Where

  * **certificate** is a PEM encoded CSR or a certificate
  * **callback** is a callback function with an error object and `{serial, country, state, locality, organization, organizationUnit, commonName, emailAddress, validity{start, end}, san{dns, ip, email}?, issuer{country, state, locality, organization, organizationUnit}, signatureAlgorithm, publicKeyAlgorithm, publicKeySize }`

? *san* is only present if the CSR or certificate has SAN entries.

*signatureAlgorithm, publicKeyAlgorithm and publicKeySize* only available if supportet and can parsed form openssl output

### Get fingerprint

Use `getFingerprint` to get the default SHA1 fingerprint for a certificate

    pem.getFingerprint(certificate, [hash], callback)

Where

  * **certificate** is a PEM encoded certificate
  * **hash** is a hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha1`)
  * **callback** is a callback function with an error object and `{fingerprint}`

### Get modulus

Use `getModulus` to get the modulus for a certificate, a CSR or a private key. Modulus can be useful to check that a Private Key Matches a Certificate

    pem.getModulus(certificate, [password], [hash], callback)

Where

  * **certificate** is a PEM encoded certificate, CSR or private key
  * **password** is an optional passphrase for passpharse protected certificates
  * **hash** is an optional hash function to use (up to now `md5` supported) (default: none)
  * **callback** is a callback function with an error object and `{modulus}`

### Get DH parameter information

Use `getDhparamInfo` to get the size and prime of DH parameters.

    pem.getDhparamInfo(dhparam, callback)

Where

  * **dhparam** is a PEM encoded DH parameters string
  * **callback** is a callback function with an error object and `{size, prime}`


### Export to a PKCS12 keystore

Use `createPkcs12` to export a certificate, the private key and optionally any signing or intermediate CA certificates to a PKCS12 keystore.

	pem.createPkcs12(clientKey, certificate, p12Password, [options], callback)

Where

* **clientKey** is a PEM encoded private key
* **certificate** is a PEM encoded certificate
* **p12Password** is the password of the exported keystore
* **options** is an optional options object with `cipher`, (one of "aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3" or "idea"), `clientKeyPassword` and `certFiles` (an array of additional certificates to include - e.g. CA certificates)
* **callback** is a callback function with an error object and `{pkcs12}` (binary)

### Read a PKCS12 keystore

Use `readPkcs12` to read a certificate, private key and CA certificates from a PKCS12 keystore.

	pem.readPkcs12(bufferOrPath, [options], callback)

Where

* **bufferOrPath** is a PKCS12 keystore as a [Buffer](https://nodejs.org/api/buffer.html) or the path to a file
* **options** is an optional options object with `clientKeyPassword` which will be used to encrypt the stored key and `p12Password` which will be used to open the keystore
* **callback** is a callback function with an error object and `{key: String, cert: String, ca: Array}`

### Check a PKCS12 keystore

Use `checkPkcs12` to check a PKCS12 keystore.

	pem.checkPkcs12(bufferOrPath, [passphrase], callback)

Where

* **bufferOrPath** is a PKCS12 keystore as a [Buffer](https://nodejs.org/api/buffer.html) or the path to a file
* **passphrase** is an optional passphrase which will be used to open the keystore
* **callback** is a callback function with an error object and a boolean as arguments

### Verify a certificate signing chain

Use `verifySigningChain` to assert that a given certificate has a valid signing chain.

    pem.verifySigningChain(certificate, ca, callback)

Where

* **certificate** is a PEM encoded certificate string
* **ca** is a PEM encoded CA certificate string or an array of certificate strings
* **callback** is a callback function with an error object and a boolean as arguments

### Check a certificate file

Use `checkCertificate` to check / verify consistency of a certificate.

    pem.checkCertificate(certificate, callback)

Where

* **certificate** is a PEM encoded certificate string
* **callback** is a callback function with an error object and a boolean as arguments
-->

### Issue certificates with an existing Certificate Authority

Use the `CA` helper when you already have a certificate authority key pair and want to issue new certificates without rebuilding the PKI state on your own.

```javascript
const fs = require('fs')
const pem = require('pem')

async function main () {
  const ca = new pem.CA({
    key: fs.readFileSync('intermediate-ca-key.pem'),
    certificate: fs.readFileSync('intermediate-ca-cert.pem'),
    chain: [fs.readFileSync('root-ca-cert.pem')]
  })

  const certificate = await ca.issueCertificate({
    commonName: 'service.internal',
    altNames: ['service.internal', '10.0.0.5']
  })

  console.log(certificate.certificate)
}

main().catch(console.error)
```

Where

* **key** is a PEM encoded private key for your certificate authority (required)
* **certificate** is the PEM encoded certificate matching `key` (required)
* **chain** is an optional array of PEM encoded certificates that should accompany issued certificates (for example a root certificate)
* **keyPassword**/**password** is an optional passphrase used to decrypt an encrypted private key
* **defaultDays** sets a default validity window (in days) that is applied when no custom dates are provided (defaults to `7`)

`issueCertificate` accepts the same options that `createCertificate` does for CSR generation (for example `commonName`, `altNames`, or a custom `config`). When no `csr` is supplied a fresh CSR and key pair are created automatically and included in the response.

Extensions from a submitted `csr` are **not** copied into the issued certificate unless you pass `copyExtensions: true` (since 2.0.0). Copying extensions from a CSR is an explicit trust decision: the `basicConstraints`, `keyUsage` and `extendedKeyUsage` values the CA controls itself always supersede what the CSR requests, so a CSR can never obtain CA privileges through copying.

By default issued certificates are valid starting "now" and expire after `defaultDays`. You can override this by supplying `startDate`, `endDate`, or `days`. Dates can be JavaScript `Date` objects, timestamps, ISO strings, or ASN.1 date strings (e.g. `20240101000000Z`).

The returned object contains the issued certificate, the CSR that was used, any generated private key, the CA certificate and chain, the serial number used for issuance, and the resolved validity window.

### Custom extensions config file

You can specify custom OpenSSL extensions using the `config` or `extFile` options for `createCertificate` (or using `csrConfigFile` with `createCSR`).

`extFile` and `csrConfigFile` should be paths to the extension files. While `config` will generate a temporary file from the supplied file contents.

If you specify `config` then the `v3_req` section of your config file will be used.

The following would be an example of a Certificate Authority extensions file:

    [req]
    req_extensions = v3_req
    distinguished_name = req_distinguished_name

    [req_distinguished_name]
    commonName = Common Name
    commonName_max = 64

    [v3_req]
    basicConstraints = critical,CA:TRUE

While the following would specify subjectAltNames in the resulting certificate:

    [req]
    req_extensions = v3_req

    [ v3_req ]
    basicConstraints = CA:FALSE
    keyUsage = nonRepudiation, digitalSignature, keyEncipherment
    subjectAltName = @alt_names

    [alt_names]
    DNS.1 = host1.example.com
    DNS.2 = host2.example.com
    DNS.3 = host3.example.com

Note that `createCertificate` and `createCSR` supports the `altNames` option which would be easier to use in most cases.

:warning: **Warning: If you specify `altNames` the custom extensions file will not be passed to OpenSSL.**

### Setting openssl location

In some systems the `openssl` executable might not be available by the default name or it is not included in $PATH. In this case you can define the location of the executable yourself as a one time action after you have loaded the pem module:

```javascript
var pem = require('pem')
pem.config({
  pathOpenSSL: '/usr/local/bin/openssl'
})
// do something with the pem module
```

### :warning: CSR/Certificates with special chars
For more details, search in `test/pem.spec.js`: `Create CSR with specialchars config file`

If you use special chars like:

```
-!$%^&*()_+|~=`{}[]:/;<>?,.@#
```

You should know that the result mey have escaped characters when you read it in your application.
Will try to fix this in the future, but not sure.


### Special thanks to

- Andris Reinman (@andris9) - Initiator of pem

## License

**MIT**
