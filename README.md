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

## ESM

`pem` ships dual CommonJS + ESM entries. In ES modules, both the default and
every public function are importable:

```js
/* eslint-disable import/no-unresolved, @typescript-eslint/no-unused-vars -- documented example, 'pem' is this package */
import pem from 'pem' // everything, like require('pem')
import { createCertificate, createCSR, convert, promisified } from 'pem'
```

Both entry points share one runtime instance, so configuration done through
one (`pem.config({...})`) is visible to the other.

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
* **options** is an optional options object with `cipher`, (one of "aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3" or "idea"), `clientKeyPassword`, `certFiles` (an array of additional certificates to include - e.g. CA certificates) and the PBE algorithm selection `certpbe`, `keypbe` (e.g. "AES-256-CBC") and `macalg` (e.g. "sha256") for openssl ≥ 3 compatibility (see the [PKCS12 PFX note](https://github.com/Dexus/pem/issues/406))
* **callback** is a callback function with an error object and `{pkcs12}` (binary)

### Read a PKCS12 keystore

Use `readPkcs12` to read a certificate, private key and CA certificates from a PKCS12 keystore.

	pem.readPkcs12(bufferOrPath, [options], callback)

Where

* **bufferOrPath** is a PKCS12 keystore as a [Buffer](https://nodejs.org/api/buffer.html) or the path to a file
* **options** is an optional options object with `clientKeyPassword` which will be used to encrypt the stored key and `p12Password` which will be used to open the keystore
* **callback** is a callback function with an error object and `{key: String, cert: String, ca: Array}`

### Convert a private key to PKCS#8

Use `createPkcs8` to convert a PEM private key to PKCS#8 format, optionally encrypted and optionally DER-encoded.

	pem.createPkcs8(key, [options], callback)

Where

* **key** is a PEM encoded private key (may itself be encrypted)
* **options** is an optional options object with `clientKeyPassword` (the password of an encrypted source key), `password` and `cipher` (one of "aes128", "aes192", "aes256", ...) to produce an *encrypted* PKCS#8 key, and `outform` ("PEM" (default, string) or "DER" (Buffer))
* **callback** is a callback function with an error object and `{pkcs8}` (string for PEM, [Buffer](https://nodejs.org/api/buffer.html) for DER)

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

### Create a Certificate Authority in a single call

Use `createCA` when you want a working certificate authority in one step: it generates the CA private key, a self-signed certificate with `CA:TRUE` basic constraints and returns a ready-to-use `CA` instance that issues certificates from it. The CA certificate defaults to a 10 year validity (pass `days` to override), so issued certificates have room for their own validity windows — including the explicit `startDate`/`endDate` windows that only `openssl ca` can encode ([issue #30](https://github.com/Dexus/pem/issues/30)).

```javascript
const pem = require('pem')

async function main () {
  const ca = await pem.createCA({
    commonName: 'Example Root CA',
    days: 3650, // CA validity, default 3650
    defaultDays: 30 // validity used by issueCertificate when no dates are given
  })

  // PEM material if you want to persist it
  console.log(ca.key)
  console.log(ca.certificate)

  // issue a certificate with an explicit validity window
  const issued = await ca.issueCertificate({
    commonName: 'service.example',
    startDate: new Date('2030-01-01T00:00:00Z'),
    endDate: new Date('2030-01-31T00:00:00Z')
  })

  console.log(issued.certificate)
  console.log(issued.caChain) // [ca.certificate]
}

main().catch(console.error)
```

Like the `CA` helper itself, `createCA` is also available as `pem.CA.createCA` and accepts a callback as its last argument instead of returning a promise.

A CA refuses to issue certificates it knows can never verify: the requested validity window must sit inside the CA certificate's own validity window, otherwise `issueCertificate` rejects with an error telling you which boundary was crossed. `openssl ca` would silently issue such certificates; the check exists because `openssl verify` validates the whole chain at usage time, so a leaf whose window reaches outside its issuer is always invalid.

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

#### Certificate profiles, serials and validity windows

`issueCertificate` creates certificates **from a CSR** (pass `csr`) **or directly** (pass subject options like `commonName`; a fresh key pair and CSR are generated for you). The serial number is generated securely (20 random bytes) unless you pass `serial` (number, hex string, `0x`-prefixed string or Buffer, max 20 octets) — the serial used is returned in the result. Validity windows can be given as `startDate`/`endDate`, as the X.509 names `notBefore`/`notAfter`, or as a relative `days` count; a window may never reach outside the CA certificate's own validity, which the CA rejects with a descriptive error instead of issuing a certificate `openssl verify` would refuse.

Instead of hand-writing extension configs, pass one of the prepared **profiles** for the intended certificate purpose:

| profile | keyUsage | extendedKeyUsage |
| --- | --- | --- |
| `server` (default is a superset) | digitalSignature, keyEncipherment | serverAuth |
| `client` | digitalSignature, keyEncipherment | clientAuth |
| `codeSigning` | digitalSignature | codeSigning |

Without a profile, issued certificates carry `digitalSignature, keyEncipherment` key usage and `serverAuth, clientAuth` extended key usage. Every profile keeps `basicConstraints` at `CA:FALSE` — a profile can never mint a CA certificate, and CSR-requested extensions are only copied with `copyExtensions: true` (and still never override the CA's own floor). A `profile` cannot be combined with `config`/`extFile`: if you need full control, pass those and own the extensions yourself.

#### Create an intermediate certificate authority

Use `createIntermediateCA` on any `CA` instance to issue a subordinate authority. The intermediate receives the prepared CA extensions — critical `CA:TRUE` with an optional `pathlen`, `keyCertSign`/`cRLSign` key usage, plus subject and authority key identifiers for clean chain building — and comes back as a working `CA` whose `chain` contains the parent chain. Its extensions are fixed by design; the method rejects `config`, `extFile` and `profile`.

```javascript
const root = await pem.createCA({ commonName: 'Example Root CA', days: 3650 })

const intermediate = await root.createIntermediateCA({
  commonName: 'Example Intermediate CA',
  pathlen: 0
})

const issued = await intermediate.issueCertificate({
  commonName: 'service.example',
  profile: 'server'
})

console.log(issued.certificate)
console.log(issued.caChain) // [intermediate.certificate, root.certificate]
```

Without explicit dates the intermediate uses the parent's whole remaining validity, so leaf certificates never reach outside it. `openssl ca` does not enforce `pathlen` at signing time — chains that exceed the constraint are refused later by `openssl verify` (error: *path length constraint exceeded*), which is exactly what a relying party does.

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

### Custom OpenSSL command line parameters

Additional command line parameters can be passed to every openssl invocation, e.g. to select an engine, provider or property query that the library does not know about:

```javascript
var pem = require('pem')
pem.config({
  openSslParams: ['-provider', 'default', '-propquery', '?legacy!=yes']
})
// every openssl command run by pem now starts with the given parameters
```

The list is merged into every spawned openssl command right after the subcommand. Use with care — invalid parameters make openssl fail; reset with `pem.config({openSslParams: []})`.

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
