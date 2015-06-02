'use strict';

var pem = require('..');
var fs = require('fs');


process.env.PEMJS_TMPDIR = './tmp';

try {
    fs.mkdirSync('./tmp');
} catch (e) {}

exports['General Tests'] = {

    'Create default sized dhparam key': function(test) {
        pem.createDhparam(function(error, data) {
            var dhparam = (data && data.dhparam || '').toString();
            test.ifError(error);
            test.ok(dhparam);
            test.ok(dhparam.match(/^\n*\-\-\-\-\-BEGIN DH PARAMETERS\-\-\-\-\-\n/));
            test.ok(dhparam.match(/\n\-\-\-\-\-END DH PARAMETERS\-\-\-\-\-\n*$/));
            test.ok(dhparam.trim().length > 150 && dhparam.trim().length < 160);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create 2048bit dhparam key': function(test) {
        pem.createDhparam(2048, function(error, data) {
            var dhparam = (data && data.dhparam || '').toString();
            test.ifError(error);
            test.ok(dhparam);
            test.ok(dhparam.match(/^\n*\-\-\-\-\-BEGIN DH PARAMETERS\-\-\-\-\-\n/));
            test.ok(dhparam.match(/\n\-\-\-\-\-END DH PARAMETERS\-\-\-\-\-\n*$/));
            test.ok(dhparam.trim().length > 420 && dhparam.trim().length < 430);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create default sized Private key': function(test) {
        pem.createPrivateKey(function(error, data) {
            var key = (data && data.key || '').toString();
            test.ifError(error);
            test.ok(key);
            test.ok(key.match(/^\n*\-\-\-\-\-BEGIN RSA PRIVATE KEY\-\-\-\-\-\n/));
            test.ok(key.match(/\n\-\-\-\-\-END RSA PRIVATE KEY\-\-\-\-\-\n*$/));
            test.ok(key.trim().length > 850 && key.trim().length < 1900);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create 2048bit Private key': function(test) {
        pem.createPrivateKey(2048, function(error, data) {
            var key = (data && data.key || '').toString();
            test.ifError(error);
            test.ok(key);
            test.ok(key.match(/^\n*\-\-\-\-\-BEGIN RSA PRIVATE KEY\-\-\-\-\-\n/));
            test.ok(key.match(/\n\-\-\-\-\-END RSA PRIVATE KEY\-\-\-\-\-\n*$/));
            test.ok(key.trim().length > 1650 && key.trim().length < 1700);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create 2048bit Private key with Password': function(test) {
        pem.createPrivateKey(2048,{cipher:'des',password:'TestMe'}, function(error, data) {
            var key = (data && data.key || '').toString();
            test.ifError(error);
            test.ok(key);
            test.ok(key.match(/ENCRYPTED\n/));
            test.ok(key.match(/^\n*\-\-\-\-\-BEGIN RSA PRIVATE KEY\-\-\-\-\-\n/));
            test.ok(key.match(/\n\-\-\-\-\-END RSA PRIVATE KEY\-\-\-\-\-\n*$/));
            test.ok(key.trim().length > 1700 && key.trim().length < 1780);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create default CSR': function(test) {
        pem.createCSR(function(error, data) {
            var csr = (data && data.csr || '').toString();
            test.ifError(error);
            test.ok(csr);
            test.ok(csr.match(/^\n*\-\-\-\-\-BEGIN CERTIFICATE REQUEST\-\-\-\-\-\n/));
            test.ok(csr.match(/\n\-\-\-\-\-END CERTIFICATE REQUEST\-\-\-\-\-\n*$/));

            test.ok(data && data.clientKey);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create CSR with own key': function(test) {
        pem.createPrivateKey(function(error, data) {
            var key = (data && data.key || '').toString();

            pem.createCSR({
                clientKey: key
            }, function(error, data) {
                var csr = (data && data.csr || '').toString();
                test.ifError(error);
                test.ok(csr);
                test.ok(csr.match(/^\n*\-\-\-\-\-BEGIN CERTIFICATE REQUEST\-\-\-\-\-\n/));
                test.ok(csr.match(/\n\-\-\-\-\-END CERTIFICATE REQUEST\-\-\-\-\-\n*$/));

                test.equal(data && data.clientKey, key);

                test.ok(data && data.clientKey);
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Create CSR with own encrypted key': function(test) {
        var password = 'my:secure! "password\'s\nawesome';
        pem.createPrivateKey(2048, { cipher: 'des3', password: password }, function(error, data) {
            var key = (data && data.key || '').toString();

            pem.createCSR({
                clientKey: key,
                clientKeyPassword: password
            }, function(error, data) {
                var csr = (data && data.csr || '').toString();
                test.ifError(error);
                test.ok(csr);
                test.ok(csr.match(/^\n*\-\-\-\-\-BEGIN CERTIFICATE REQUEST\-\-\-\-\-\n/));
                test.ok(csr.match(/\n\-\-\-\-\-END CERTIFICATE REQUEST\-\-\-\-\-\n*$/));

                test.equal(data && data.clientKey, key);

                test.ok(data && data.clientKey);
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Create default certificate': function(test) {
        pem.createCertificate(function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(certificate);
            test.ok(certificate.match(/^\n*\-\-\-\-\-BEGIN CERTIFICATE\-\-\-\-\-\n/));
            test.ok(certificate.match(/\n\-\-\-\-\-END CERTIFICATE\-\-\-\-\-\n*$/));

            test.ok((data && data.clientKey) !== (data && data.serviceKey));

            test.ok(data && data.clientKey);
            test.ok(data && data.serviceKey);
            test.ok(data && data.csr);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Create self signed certificate': function(test) {
        pem.createCertificate({
            selfSigned: true
        }, function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(certificate);
            test.ok(certificate.match(/^\n*\-\-\-\-\-BEGIN CERTIFICATE\-\-\-\-\-\n/));
            test.ok(certificate.match(/\n\-\-\-\-\-END CERTIFICATE\-\-\-\-\-\n*$/));

            test.ok((data && data.clientKey) === (data && data.serviceKey));

            test.ok(data && data.clientKey);
            test.ok(data && data.serviceKey);
            test.ok(data && data.csr);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.done();
        });
    },

    'Read default cert data from CSR': function(test) {
        pem.createCSR(function(error, data) {
            var csr = (data && data.csr || '').toString();
            test.ifError(error);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.readCertificateInfo(csr, function(error, data) {
                test.ifError(error);
                test.deepEqual(data, {
                    issuer : {},
                    country: '',
                    state: '',
                    locality: '',
                    organization: '',
                    organizationUnit: '',
                    commonName: 'localhost',
                    emailAddress: ''
                });
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Read edited cert data from CSR': function(test) {
        var certInfo = {
            issuer : {},
            country: 'EE',
            state: 'Harjumaa',
            locality: 'Tallinn',
            organization: 'Node.ee',
            organizationUnit: 'test',
            commonName: 'www.node.ee',
            emailAddress: 'andris@node.ee'
        };
        pem.createCSR(Object.create(certInfo), function(error, data) {
            var csr = (data && data.csr || '').toString();
            test.ifError(error);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.readCertificateInfo(csr, function(error, data) {
                test.ifError(error);
                test.deepEqual(data, certInfo);
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Read default cert data from certificate': function(test) {
        pem.createCertificate(function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.readCertificateInfo(certificate, function(error, data) {
                test.ifError(error);

                if (data.validity) {
                    delete data.validity;
                }

                test.deepEqual(data, {
                    issuer : {
                        country: '',
                        state: '',
                        locality: '',
                        organization: '',
                        organizationUnit: '',
                        commonName: 'localhost'
                    },
                    country: '',
                    state: '',
                    locality: '',
                    organization: '',
                    organizationUnit: '',
                    commonName: 'localhost',
                    emailAddress: ''
                });
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Read edited cert data from certificate': function(test) {
        var certInfo = {
            issuer : {
                country: 'EE',
                state: 'Harjumaa',
                locality: 'Tallinn',
                organization: 'Node.ee',
                organizationUnit: 'test',
                commonName: 'www.node.ee'
            },
            country: 'EE',
            state: 'Harjumaa',
            locality: 'Tallinn',
            organization: 'Node.ee',
            organizationUnit: 'test',
            commonName: 'www.node.ee',
            emailAddress: 'andris@node.ee'
        };
        pem.createCertificate(Object.create(certInfo), function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.readCertificateInfo(certificate, function(error, data) {
                test.ifError(error);

                if (data.validity) {
                    delete data.validity;
                }

                test.deepEqual(data, certInfo);
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Get public key from private key': function(test) {
        pem.createPrivateKey(function(error, data) {
            var key = (data && data.key || '').toString();
            test.ifError(error);
            test.ok(key);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.getPublicKey(key, function(error, data) {
                var pubkey = (data && data.publicKey || '').toString();
                test.ifError(error);
                test.ok(pubkey);

                test.ok(pubkey.match(/^\n*\-\-\-\-\-BEGIN PUBLIC KEY\-\-\-\-\-\n/));
                test.ok(pubkey.match(/\n\-\-\-\-\-END PUBLIC KEY\-\-\-\-\-\n*$/));
                test.ok(fs.readdirSync('./tmp').length === 0);

                test.done();
            });
        });
    },

    'Get public key from CSR': function(test) {
        pem.createCSR(function(error, data) {
            var key = (data && data.clientKey || '').toString();
            test.ifError(error);
            test.ok(key);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.getPublicKey(key, function(error, data) {
                var pubkey = (data && data.publicKey || '').toString();
                test.ifError(error);
                test.ok(pubkey);

                test.ok(pubkey.match(/^\n*\-\-\-\-\-BEGIN PUBLIC KEY\-\-\-\-\-\n/));
                test.ok(pubkey.match(/\n\-\-\-\-\-END PUBLIC KEY\-\-\-\-\-\n*$/));
                test.ok(fs.readdirSync('./tmp').length === 0);

                test.done();
            });
        });
    },

    'Get public key from certificate': function(test) {
        pem.createCertificate(function(error, data) {
            var key = (data && data.clientKey || '').toString();
            test.ifError(error);
            test.ok(key);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.getPublicKey(key, function(error, data) {
                var pubkey = (data && data.publicKey || '').toString();
                test.ifError(error);
                test.ok(pubkey);

                test.ok(pubkey.match(/^\n*\-\-\-\-\-BEGIN PUBLIC KEY\-\-\-\-\-\n/));
                test.ok(pubkey.match(/\n\-\-\-\-\-END PUBLIC KEY\-\-\-\-\-\n*$/));
                test.ok(fs.readdirSync('./tmp').length === 0);

                test.done();
            });
        });
    },

    'Get fingerprint from certificate': function(test) {
        pem.createCertificate(function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(certificate);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.getFingerprint(certificate, function(error, data) {
                var fingerprint = (data && data.fingerprint || '').toString();
                test.ifError(error);
                test.ok(fingerprint);
                test.ok(fingerprint.match(/^[0-9A-F]{2}(:[0-9A-F]{2}){19}$/));
                test.ok(fs.readdirSync('./tmp').length === 0);

                test.done();
            });
        });
    },

    'Get modulus from certificate': function(test) {
        pem.createCertificate(function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(certificate);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.getModulus(certificate, function(error, data) {
                var certmodulus = (data && data.modulus || '').toString();
                test.ifError(error);
                test.ok(certmodulus);
                test.ok(certmodulus.match(/^[0-9A-F]*$/));
                test.ok(fs.readdirSync('./tmp').length === 0);
                pem.getModulus(certificate, function(error, data) {
                    var keymodulus = (data && data.modulus || '').toString();
                    test.ifError(error);
                    test.ok(keymodulus);
                    test.ok(keymodulus.match(/^[0-9A-F]*$/));
                    test.ok(keymodulus === certmodulus);
                    test.ok(fs.readdirSync('./tmp').length === 0);
                    test.done();
                });
            });
        });
    },

    'Get modulus from a protected key': function(test) {
        var certificate = fs.readFileSync('./test/fixtures/test.crt').toString();
        var key = fs.readFileSync('./test/fixtures/test.key').toString();

        pem.getModulus(certificate, function(error, data) {
            var certmodulus = (data && data.modulus || '').toString();
            test.ifError(error);
            test.ok(certmodulus);
            test.ok(certmodulus.match(/^[0-9A-F]*$/));
            test.ok(fs.readdirSync('./tmp').length === 0);
            pem.getModulusFromProtected(key, 'password' ,function(error, data) {
                var keymodulus = (data && data.modulus || '').toString();
                test.ifError(error);
                test.ok(keymodulus);
                test.ok(keymodulus.match(/^[0-9A-F]*$/));
                test.ok(keymodulus === certmodulus);
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },

    'Get DH param info': function(test) {
        var dh = fs.readFileSync('./test/fixtures/test.dh').toString();

        pem.getDhparamInfo(dh, function(error, data) {
            var size = data && data.size || 0;
            var prime = (data && data.prime || '').toString();
            test.ifError(error);
            test.equal(size, 1024);
            test.ok(prime);
            test.ok(fs.readdirSync('./tmp').length === 0);
            test.equal(typeof size, 'number');
            test.ok(/([0-9a-f][0-9a-f]:)+[0-9a-f][0-9a-f]$/g.test(prime));
            test.done();
        });
    },

    'Create and verify wildcard certificate': function(test) {
        var certInfo = {
            commonName: '*.node.ee'
        };
        pem.createCertificate(Object.create(certInfo), function(error, data) {
            var certificate = (data && data.certificate || '').toString();
            test.ifError(error);
            test.ok(fs.readdirSync('./tmp').length === 0);

            pem.readCertificateInfo(certificate, function(error, data) {
                test.ifError(error);
                test.equal(data.commonName, certInfo.commonName);
                test.ok(fs.readdirSync('./tmp').length === 0);
                test.done();
            });
        });
    },
    'Return an error if openssl was not found': function(test) {
        pem.config({
            pathOpenSSL: 'zzzzzzzzzzz'
        });

        pem.createPrivateKey(function(error) {
            test.ok(error);
            pem.config({
                pathOpenSSL: 'openssl'
            });
            pem.createPrivateKey(function(error) {
                test.ifError(error);
                test.done();
            });
        });
    }
};