var spawn = require("child_process").spawn,
    os = require("os"),
    pathlib = require("path"),
    fs = require("fs"),
    crypto = require("crypto"),
    tempDir = (os.tmpdir || os.tmpDir) && (os.tmpdir || os.tmpDir)() || "/tmp";

module.exports.createPrivateKey = createPrivateKey;
module.exports.createCSR =createCSR;
module.exports.createCertificate = createCertificate;
module.exports.readCertificateInfo = readCertificateInfo;
module.exports.getPublicKey = getPublicKey;
module.exports.getFingerprint = getFingerprint;
module.exports.getModulus = getModulus;

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

    keyBitsize = Number(keyBitsize) || 1024;

    var params = ["genrsa",
                  "-rand",
                  "/var/log/mail:/var/log/messages",
                  keyBitsize
                  ];

    execOpenSSL(params, "RSA PRIVATE KEY", function(error, key){
        if(error){
            return callback(error);
        }
        return callback(null, {key: key});
    });
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

    var params = ["req",
                  "-new",
                  "-" + (options.hash || "sha1"),
                  "-subj",
                  generateCSRSubject(options),
                  "-key",
                  "--TMPFILE--"
                  ];

    execOpenSSL(params, "CERTIFICATE REQUEST", options.clientKey, function(error, data){
        if(error){
            return callback(error);
        }
        var response = {
                csr: data,
                clientKey: options.clientKey
            };
        return callback(null, response);

    });
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

    var params = ["x509",
                  "-req",
                  "-days",
                  Number(options.days) || "365",
                  "-in",
                  "--TMPFILE--"
                  ];
    var tmpfiles = [options.csr];
    if (options.serviceCertificate) {
        if (!options.serial) {
            return callback(new Error("serial option required for CA signing"));
        }
        params.push("-CA");
        params.push("--TMPFILE--");
        params.push("-CAkey");
        params.push("--TMPFILE--");
        params.push("-set_serial");
        params.push("0x" + ("00000000" + options.serial.toString(16)).slice(-8));
        tmpfiles.push(options.serviceCertificate)
        tmpfiles.push(options.serviceKey)
    } else {
        params.push("-signkey");
        params.push("--TMPFILE--");
        tmpfiles.push(options.serviceKey)
    }

    execOpenSSL(params, "CERTIFICATE", tmpfiles, function(error, data){
        if(error){
            return callback(error);
        }
        var response = {
                csr: options.csr,
                clientKey: options.clientKey,
                certificate: data,
                serviceKey: options.serviceKey
            };
        return callback(null, response);
    });
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
        params = ["req",
                  "-in",
                  "--TMPFILE--",
                  "-pubkey",
                  "-noout"];
    }else if(certificate.match(/BEGIN RSA PRIVATE KEY/)){
        params = ["rsa",
                  "-in",
                  "--TMPFILE--",
                  "-pubout"];
    }else{
        params = ["x509",
                  "-in",
                  "--TMPFILE--",
                  "-pubkey",
                  "-noout"];
    }

    execOpenSSL(params, "PUBLIC KEY", certificate, function(error, key){
        if(error){
            return callback(error);
        }
        return callback(null, {publicKey: key});
    });
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

    var type = certificate.match(/BEGIN CERTIFICATE REQUEST/)?"req":"x509",
        params = [type,
                  "-noout",
                  "-text",
                  "-in",
                  "--TMPFILE--"
                  ];
    spawnWrapper(params, certificate, function(err, code, stdout, stderr){
        if (err) {
            return callback(err);
        }
        return fetchCertificateData(stdout, callback);
    });
}

/**
 * get the modulus from a certificate, a CSR or a private key
 *
 * @param {String} certificate PEM encoded, CSR PEM encoded, or private key
 * @param {Function} callback Callback function with an error object and {modulus}
 */
function getModulus(certificate, callback){
    var type = "";
    if ( certificate.match(/BEGIN CERTIFICATE REQUEST/)){
        type="req";
    }else if ( certificate.match(/BEGIN RSA PRIVATE KEY/)){
        type="rsa";
    }else {
        type="x509";
    }
    params = [type,
              "-noout",
              "-modulus",
              "-in",
              "--TMPFILE--"
    ];
    spawnWrapper(params, certificate, function(err, code, stdout, stderr){
        if (err) {
            return callback(err);
        }
        var match = stdout.match(/Modulus=([0-9a-fA-F]+)$/m);
        if (match){
            return callback(null, {modulus: match[1]});
        } else {
            return callback(new Error("No modulus"));
        }
    });
}

/**
 * Gets the fingerprint for a certificate
 *
 * @param {String} PEM encoded certificate
 * @param {Function} callback Callback function with an error object and {fingerprint}
 */
function getFingerprint(certificate, callback){
    var params = ["x509",
                  "-in",
                  "--TMPFILE--",
                  "-fingerprint",
                  "-noout"];

    spawnWrapper(params, certificate, function(err, code, stdout, stderr){
        if (err) {
            return callback(err);
        }
        var match = stdout.match(/Fingerprint=([0-9a-fA-F:]+)$/m);
        if (match){
            return callback(null, {fingerprint: match[1]});
        } else {
            return callback(new Error("No fingerprint"));
        }
    });
}

// HELPER FUNCTIONS

function fetchCertificateData(certData, callback){
    certData = (certData || "").toString();

    var subject, extra, tmp, certValues = {};
    var validity = {};

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
    if ((tmp = certData.match(/Not Before\s?:\s?([^\n]*)\n/)) && tmp.length>1)
       validity.start = Date.parse(tmp && tmp[1] || "");
    if ((tmp = certData.match(/Not After\s?:\s?([^\n]*)\n/)) && tmp.length>1)
       validity.end = Date.parse(tmp && tmp[1] || "");
    if (validity.start && validity.end)
       certValues.validity = validity;

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

/**
 * Generically spawn openSSL, without processing the result
 *
 * @param {Array}        params   The parameters to pass to openssl
 * @param {String|Array} tmpfiles    Stuff to pass to tmpfiles
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 */
function spawnOpenSSL(params, callback) {
    var openssl = spawn("openssl", params),
        stdout = "",
        stderr = "";

    openssl.stdout.on('data', function (data) {
        stdout += (data || "").toString("binary");
    });

    openssl.stderr.on('data', function (data) {
        stderr += (data || "").toString("binary");
    });

    // We need both the return code and access to all of stdout.  Stdout isn't
    // *really* available until the close event fires; the timing nuance was
    // making this fail periodically.
    var needed = 2;  // wait for both exit and close.
    var code = -1;
    var bothDone = function() {
        if (code) {
            callback(new Error("Invalid openssl exit code: " + code + "\n% openssl " + params.join(" ") + "\n" + stderr), code);
        } else {
            callback(null, code, stdout, stderr);
        }
    };

    openssl.on('exit', function (ret) {
        code = ret;
        if (--needed < 1) {
            bothDone();
        }
    });

    openssl.on('close', function () {
        stdout = new Buffer(stdout, "binary").toString("utf-8");
        stderr = new Buffer(stderr, "binary").toString("utf-8");

        if (--needed < 1) {
            bothDone();
        }
    });
}

function spawnWrapper(params, tmpfiles, callback){
    var files = [];

    if(tmpfiles){
        tmpfiles = [].concat(tmpfiles || []);
        params.forEach(function(value, i){
            var fname;
            if(value == "--TMPFILE--"){
                fpath = pathlib.join(tempDir, crypto.randomBytes(20).toString("hex"));
                files.push({
                    path: fpath,
                    contents: tmpfiles.shift()
                });
                params[i] = fpath;
            }
        })
    }

    var processFiles = function(){
        var file = files.shift();

        if(!file){
            return spawnSSL();
        }

        fs.writeFile(file.path, file.contents, function(err, bytes){
            processFiles();
        });
    }

    var spawnSSL = function(){
        spawnOpenSSL(params, function(err, code, stdout, stderr) {
            var start, end;

            files.forEach(function(file){
                fs.unlink(file.path);
            })

            callback(err, code, stdout, stderr);
        });
    }

    processFiles();

}

/**
 * Spawn an openssl command
 */
function execOpenSSL(params, searchStr, tmpfiles, callback){
    if(!callback && typeof tmpfiles == "function"){
        callback = tmpfiles;
        tmpfiles = false;
    }

    spawnWrapper(params, tmpfiles, function(err, code, stdout, stderr) {
        var start, end;

        if (err) {
            return callback(err);
        }

        if((start = stdout.match(new RegExp("\\-+BEGIN "+searchStr+"\\-+$", "m")))){
            start = start.index;
        }else{
            start = -1;
        }

        if((end = stdout.match(new RegExp("^\\-+END "+searchStr+"\\-+", "m")))){
            end = end.index + (end[0] || "").length;
        }else{
            end = -1;
        }

        if(start >= 0 && end >=0){
            return callback(null, stdout.substring(start, end));
        }else{
            return callback(new Error(searchStr + " not found from openssl output:\n---stdout---\n" + stdout + "\n---stderr---\n" + stderr + "\ncode: " + code + "\nsignal: " + signal));
        }
    });
}
