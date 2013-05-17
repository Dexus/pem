var spawn = require("child_process").spawn,
    os = require("os"),
    pathlib = require("path"),
    fs = require("fs"),
    crypto = require("crypto"),
    ursa = require("ursa");

module.exports.createPrivateKey = createPrivateKey;
module.exports.createCSR =createCSR;
module.exports.createCertificate = createCertificate;
module.exports.readCertificateInfo = readCertificateInfo;
module.exports.getPublicKey = getPublicKey;
module.exports.getFingerprint = getFingerprint;

// PUBLIC API

/**
 * Creates a private key
 *
 * @param {Number} [keyBitsize=1024] Size of the key, defaults to 1024bit
 * @param {Function} callback Callback function with an error object and {key}
 */
function createPrivateKey(keyBitsize, callback){
    if(!callback && typeof keyBitsize == "function"){
        callback = keyBitsize;
        keyBitsize = undefined;
    }
    var key = ursa.generatePrivateKey(Number(keyBitsize) || 1024);
    callback(null, {key: key.toPrivatePem().toString()});
}

/**
 * Creates a Certificate Signing Request
 *
 * If client key is undefined, a new key is created automatically. The used key is included
 * in the callback return as clientKey
 *
 * @param {Object} [options] Optional options object
 * @param {String} [options.clientKey] Optional client key to use
 * @param {Number} [options.keyBitsize] If clientKey is undefined, bit size to use for generating a new key (defaults to 1024)
 * @param {String} [options.hash] Hash function to use (either md5 or sha1, defaults to sha1)
 * @param {String} [options.country] CSR country field
 * @param {String} [options.state] CSR state field
 * @param {String} [options.locality] CSR locality field
 * @param {String} [options.organization] CSR organization field
 * @param {String} [options.organizationUnit] CSR organizational unit field
 * @param {String} [options.commonName="localhost"] CSR common name field
 * @param {String} [options.emailAddress] CSR email address field
 * @param {Function} callback Callback function with an error object and {csr, clientKey}
 */
function createCSR(options, callback){
    if(!callback && typeof options == "function"){
        callback = options;
        options = undefined;
    }

    options = options || {};

    if(!options.clientKey){
        createPrivateKey(options.keyBitsize || 1024, function(error, keyData){
            if(error){
                return callback(error);
            }
            options.clientKey = keyData.key;
            createCSR(options, callback);
        });
        return;
    }

    var signer = ursa.createSigner(options.hash || "sha1");
    signer.update(generateCSRSubject(options));
    var csr = '-----BEGIN CERTIFICATE REQUEST-----\n' + pemify(signer.sign(ursa.coercePrivateKey(options.clientKey))) + '-----END CERTIFICATE REQUEST-----';
    callback(null, {clientKey: options.clientKey, csr: csr});
}

/**
 * Creates a certificate based on a CSR. If CSR is not defined, a new one
 * will be generated automatically. For CSR generation all the options values
 * can be used as with createCSR.
 *
 * @param {Object} [options] Optional options object
 * @param {String} [options.serviceKey] Private key for signing the certificate, if not defined a new one is generated
 * @param {Boolean} [options.selfSigned] If set to true and serviceKey is not defined, use clientKey for signing
 * @param {String} [options.csr] CSR for the certificate, if not defined a new one is generated
 * @param {Number} [options.days] Certificate expire time in days
 * @param {Function} callback Callback function with an error object and {certificate, csr, clientKey, serviceKey}
 */
function createCertificate(options, callback){
    if(!callback && typeof options == "function"){
        callback = options;
        options = undefined;
    }

    options = options || {};

    if(!options.csr){
        createCSR(options, function(error, keyData){
            if(error){
                return callback(error);
            }
            options.csr = keyData.csr;
            options.clientKey = keyData.clientKey;
            createCertificate(options, callback);
        });
        return;
    }

    if(!options.serviceKey){

        if(options.selfSigned){
            options.serviceKey = options.clientKey;
        }else{
            createPrivateKey(options.keyBitsize || 1024, function(error, keyData){
                if(error){
                    return callback(error);
                }
                options.serviceKey = keyData.key;
                createCertificate(options, callback);
            });
            return;
        }
    }

    if (options.serviceCertificate) {
        if (!options.serial) {
            return callback(new Error("serial option required for CA signing"));
        }
    } else {
    }
}

/**
 * Exports a public key from a private key, CSR or certificate
 *
 * @param {String} certificate PEM encoded private key, CSR or certificate
 * @param {Function} callback Callback function with an error object and {publicKey}
 */
function getPublicKey(certificate, callback){
    if(!callback && typeof certificate == "function"){
        callback = certificate;
        certificate = undefined;
    }

    certificate = (certificate || "").toString();

    var params;

    if(certificate.match(/BEGIN CERTIFICATE REQUEST/)){
    }else if(certificate.match(/BEGIN RSA PRIVATE KEY/)){
    }else{
    }
}

/**
 * Reads subject data from a certificate or a CSR
 *
 * @param {String} certificate PEM encoded CSR or certificate
 * @param {Function} callback Callback function with an error object and {country, state, locality, organization, organizationUnit, commonName, emailAddress}
 */
function readCertificateInfo(certificate, callback){
    if(!callback && typeof certificate == "function"){
        callback = certificate;
        certificate = undefined;
    }
    certificate = (certificate || "").toString();
    var type = certificate.match(/BEGIN CERTIFICATE REQUEST/)?"req":"x509";
}

/**
 * Gets the fingerprint for a certificate
 *
 * @param {String} PEM encoded certificate
 * @param {Function} callback Callback function with an error object and {fingerprint}
 */
function getFingerprint(certificate, callback){
}

// HELPER FUNCTIONS

function pemify(buffer) {
    var result = '';
    var str = buffer.toString('base64');
    while (str.length > 0) {
        result += str.substring(0, 64) + '\n';
        str = str.substring(64);
    }
    return result;
}

function fetchCertificateData(certData, callback){
    certData = (certData || "").toString();

    var subject, extra, tmp, certValues = {};

    if((subject = certData.match(/Subject:([^\n]*)\n/)) && subject.length>1){
        subject = subject[1];
        extra = subject.split("/");
        subject = extra.shift()+"\n";
        extra = extra.join("/")+"\n";

        // country
        tmp = subject.match(/\sC=([^,\n].*?)[,\n]/);
        certValues.country = tmp && tmp[1] || "";
        // state
        tmp = subject.match(/\sST=([^,\n].*?)[,\n]/);
        certValues.state = tmp && tmp[1] || "";
        // locality
        tmp = subject.match(/\sL=([^,\n].*?)[,\n]/);
        certValues.locality = tmp && tmp[1] || "";
        // organization
        tmp = subject.match(/\sO=([^,\n].*?)[,\n]/);
        certValues.organization = tmp && tmp[1] || "";
        // unit
        tmp = subject.match(/\sOU=([^,\n].*?)[,\n]/);
        certValues.organizationUnit = tmp && tmp[1] || "";
        // common name
        tmp = subject.match(/\sCN=([^,\n].*?)[,\n]/);
        certValues.commonName = tmp && tmp[1] || "";
        //email
        tmp = extra.match(/emailAddress=([^,\n\/].*?)[,\n\/]/);
        certValues.emailAddress = tmp && tmp[1] || "";
    }
    callback(null, certValues);
}

function generateCSRSubject(options){

    options = options || {};

    var csrData = {
            C: options.country || options.C || "",
            ST: options.state || options.ST || "",
            L: options.locality || options.L || "",
            O: options.organization || options.O || "",
            OU: options.organizationUnit || options.OU || "",
            CN: options.commonName || options.CN || "localhost",
            emailAddress: options.emailAddress || ""
        },
        csrBuilder = [];

    Object.keys(csrData).forEach(function(key){
        if(csrData[key]){
            csrBuilder.push("/" + key + "=" + csrData[key].replace(/[^\w \.\-@]+/g, " ").trim());
        }
    });

    return csrBuilder.join("");
}
