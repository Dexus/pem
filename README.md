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
        res.end('o hai!')
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
    res.send('o hai!');
  });

  https.createServer({key: keys.serviceKey, cert: keys.certificate}, app).listen(443);
});
```

## API

### Create a dhparam key

Use `createDhparam` for creating dhparam keys

    pem.createDhparam(keyBitsize, callback)

Where

  * **keyBitsize** is an optional size of the key, defaults to 512 (bit)
  * **callback** is a callback function with an error object and `{dhparam}`

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
  * **serviceKeyPassword** Password of the service key
  * **serviceCertificate** is the optional certificate for the `serviceKey`
  * **serial** is the unique serial number for the signed certificate, required if `serviceCertificate` is defined
  * **selfSigned** - if set to true and `serviceKey` is not defined, use `clientKey` for signing
  * **csr** is a CSR for the certificate, if not defined a new one is generated
  * **days** is the certificate expire time in days
  * **extFile** extension config file - **without** `-extensions v3_req`
  * **config** extension config file - **with** `-extensions v3_req`

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
  * **callback** is a callback function with an error object and `{serial, country, state, locality, organization, organizationUnit, commonName, emailAddress, validity{start, end}, san{dns, ip}?, issuer{country, state, locality, organization, organizationUnit} }`

? *san* is only present if the CSR or certificate has SAN entries.

### Get fingerprint

Use `getFingerprint` to get the default SHA1 fingerprint for a certificate

    pem.getFingerprint(certificate, [hash,] callback)

Where

  * **certificate** is a PEM encoded certificate
  * **hash** is a hash function to use (either `md5`, `sha1` or `sha256`, defaults to `sha1`)
  * **callback** is a callback function with an error object and `{fingerprint}`

### Get modulus

Use `getModulus` to get the modulus for a certificate, a CSR or a private key. Modulus can be useful to check that a Private Key Matches a Certificate

    pem.getModulus(certificate, callback)

Where

  * **certificate** is a PEM encoded certificate, CSR or private key
  * **callback** is a callback function with an error object and `{modulus}`

### Get DH parameter information

Use `getDhparamInfo` to get the size and prime of DH parameters.

    pem.getDhparamInfo(dhparam, callback)

Where

  * **dhparam** is a PEM encoded DH parameters string
  * **callback** is a callback function with an error object and `{size, prime}`

  
## Export to PKCS12 keystore

Use `createPkcs12` to export a certificate and the private key to a PKCS12 keystore.

	pem.createPkcs12(clientKey, certificate, p12Password, [options], callback)
	
Where

* **clientKey** is a PEM encoded private key
* **certificate** is a PEM encoded certificate
* **p12Password** is the password of the exported keystore
* **options** is an optional options object with `cipher` and `clientKeyPassword` (ciphers:["aes128", "aes192", "aes256", "camellia128", "camellia192", "camellia256", "des", "des3", "idea"])
* **callback** is a callback function with an error object and `{pkcs12}` (binary)

## Verify a certificate signing chain

Use `verifySigningChain` to assert that a given certificate has a valid signing chain.

    pem.verifySigningChain(certificate, ca, callback)

Where

* **certificate** is a PEM encoded certificate string
* **ca** is a PEM encoded CA certificate string or an array of certificate strings
* **callback** is a callback function with an error object and a boolean as arguments

### Setting openssl location

In some systems the `openssl` executable might not be available by the default name or it is not included in $PATH. In this case you can define the location of the executable yourself as a one time action after you have loaded the pem module:

```javascript
var pem = require('pem');
pem.config({
    pathOpenSSL: '/usr/local/bin/openssl'
});
...
// do something with the pem module
```

## License

**MIT**
