pem
===

Create private keys and certificates with node.js

[![Build Status](https://secure.travis-ci.org/andris9/pem.png)](http://travis-ci.org/andris9/pem)

**NB!** This module does not yet support node v0.7+/0.8 or Windows. Sorry.

## Installation

Install with npm

    npm install pem

## API

### Create a private key

Use `createPrivateKey` for creating private keys

    pem.createPrivateKey(keyBitsize, callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 1024 (bit)
  * **callback** is a callback function with an error object and `{key}`

### Create a Certificate Signing Request

Use `createCSR` for creating private keys

    pem.createCSR(options, callback)

Where

  * **options** is an optional options object
  * **callback** is a callback function with an error object and `{csr, clientKey}`

Possible options are the following

  * **clientKey** is an optional client key to use
  * **keyBitsize** - if `clientKey` is undefined, bit size to use for generating a new key (defaults to 1024)
  * **hash** is a hash function to use (either `md5` or `sha1`, defaults to `sha1`)
  * **country** is a CSR country field
  * **state** is a CSR state field
  * **locality** is a CSR locality field
  * **organization** is a CSR organization field
  * **organizationUnit** is a CSR organizational unit field
  * **commonName** is a CSR common name field (defaults to `localhost`)
  * **emailAddress** is a CSR email address field

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
  * **selfSigned** - if set to true and `serviceKey` is not defined, use `clientKey` for signing
  * **csr** is a CSR for the certificate, if not defined a new one is generated
  * **days** is the certificate expire time in days

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
  * **callback** is a callback function with an error object and `{country, state, locality, organization, organizationUnit, commonName, emailAddress}`

## License

**MIT**