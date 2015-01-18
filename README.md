pem
===

Create private keys and certificates with node.js

[![Build Status](https://secure.travis-ci.org/andris9/pem.png)](http://travis-ci.org/andris9/pem)

## Installation

Install with npm

    npm install pem

## Examples

Here are some examples for creating an SSL key/cert on the fly, and running an HTTPS server on port 443.  443 is the standard HTTPS port, but requires root permissions on most systems.  To get around this, you could use a higher port number, like 4300, and use https://localhost:4300 to access your server.

### Basic https
```javascript
var https = require('https'),
    pem = require('pem');

pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
    https.createServer({key: keys.serviceKey, cert: keys.certificate}, function(req, res){
        res.end("o hai!")
    }).listen(443);
});
```

###  Express
```javascript
var https = require('https'),
    pem = require('pem'),
    express = require('express');

pem.createCertificate({days:1, selfSigned:true}, function(err, keys){
  var app = express();

  app.get('/',  requireAuth, function(req, res){
    res.send("o hai!");
  });

  https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(443);
});
```

## API

### Create a private key

Use `createPrivateKey` for creating private keys

    pem.createPrivateKey(keyBitsize, callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 2048 (bit)
  * **callback** is a callback function with an error object and `{key}`

### Create a Certificate Signing Request

Use `createCSR` for creating certificate signing requests

    pem.createCSR(options, callback)

Where

  * **options** is an optional options object
  * **callback** is a callback function with an error object and `{csr, clientKey}`

Possible options are the following

  * **clientKey** is an optional client key to use
  * **keyBitsize** - if `clientKey` is undefined, bit size to use for generating a new key (defaults to 2048)
  * **hash** is a hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha256`)
  * **country** is a CSR country field
  * **state** is a CSR state field
  * **locality** is a CSR locality field
  * **organization** is a CSR organization field
  * **organizationUnit** is a CSR organizational unit field
  * **commonName** is a CSR common name field (defaults to `localhost`)
  * **altNames** is a list (`Array`) of subjectAltNames in the subjectAltName field (optional)
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
  * **serviceCertificate** is the optional certificate for the `serviceKey`
  * **serial** is the unique serial number for the signed certificate, required if `serviceCertificate` is defined
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
  * **callback** is a callback function with an error object and `{country, state, locality, organization, organizationUnit, commonName, emailAddress, validity{start, end}, san{dns, ip}? }`

? *san* is only present if the CSR or certificate has SAN entries.

### Get fingerprint

Use `getFingerprint` to get the SHA1 fingerprint for a certificate

    pem.getFingerprint(certificate, callback)

Where

  * **certificate** is a PEM encoded certificate
  * **callback** is a callback function with an error object and `{fingerprint}`

### Get modulus

Use `getModulus` to get the modulus for a certificate, a CSR or a private key. Modulus can be useful to check that a Private Key Matches a Certificate

    pem.getModulus(certificate, callback)

Where

  * **certificate** is a PEM encoded certificate, CSR or private key
  * **callback** is a callback function with an error object and `{modulus}`

## License

**MIT**