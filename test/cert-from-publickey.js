'use strict';

var pem = require('..');
var fs = require('fs');


process.env.PEMJS_TMPDIR = './tmp';

try {
    fs.mkdirSync('./tmp');
} catch (e) {}

exports['OpenSSL 1.0.2 Tests'] = {
    'Fail when required OpenSSL not used': function(test) {
        pem.config({
            pathOpenSSL: './test/bin/openssl-1.0.1'
        });

        pem.createCertificate({
          publicKey: '123'
        }, function (error) {
          test.ok(error && error.message === 'publicKey option requires openssl 1.0.2 or newer, you used 1.0.1');
          test.done();
        });
    },
    'Create certificate from public key': function(test) {
        pem.config({
            pathOpenSSL: process.env.pathOpenSSL || '/usr/bin/openssl'
        });

        // create a key pair
        pem.createCertificate(function (error, data) {
          var cert = (data && data.certificate || '').toString();

          // extract the public key
          pem.getPublicKey(cert, function (error, data) {
            var key = (data && data.publicKey || '').toString();

            // create CA key pair
            pem.createCertificate({
              selfSigned: true
            }, function (error, data) {

              // create the test certificate from extracted public key
              pem.createCertificate({
                  publicKey: key,
                  serviceKey: data.serviceKey,
                  serviceCertificate: data.certificate,
              }, function(error, data) {
                  var certificate = (data && data.certificate || '').toString();
                  test.ifError(error);
                  test.ok(certificate);
                  test.ok(certificate.match(/^\n*\-\-\-\-\-BEGIN CERTIFICATE\-\-\-\-\-\n/));
                  test.ok(certificate.match(/\n\-\-\-\-\-END CERTIFICATE\-\-\-\-\-\n*$/));

                  test.ok((data && data.clientKey) !== (data && data.serviceKey));

                  test.ok(data && data.clientKey);
                  test.ok(data && data.serviceKey);
                  test.ok(data && data.csr);

                  // extract the public key from certificate
                  pem.getPublicKey(certificate, function(error, data) {
                    var result = (data && data.publicKey || '').toString();
                    test.ifError(error);
                    test.ok(result === key);
                    test.ok(fs.readdirSync('./tmp').length === 0);
                    test.done();
                  });
              });
            });
          });
        });

    }
};
