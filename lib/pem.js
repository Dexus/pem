var spawn = require("child_process").spawn;

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
                  "/dev/stdin"
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
                  "/dev/stdin"
                  ];
    var stdin = [options.csr];
    if (options.serviceCertificate) {
        if (!options.serial) {
            return callback(new Error("serial option required for CA signing"));
        }
        params.push("-CA");
        params.push("/dev/stdin");
        params.push("-CAkey");
        params.push("/dev/stdin");
        params.push("-set_serial");
        params.push("0x" + ("00000000" + options.serial.toString(16)).slice(-8));
        stdin.push(options.serviceCertificate)
        stdin.push(options.serviceKey)
    } else {
        params.push("-signkey");
        params.push("/dev/stdin");
        stdin.push(options.serviceKey)
    }

    execOpenSSL(params, "CERTIFICATE", stdin, function(error, data){
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
                  "/dev/stdin",
                  "-pubkey",
                  "-noout"];
    }else if(certificate.match(/BEGIN RSA PRIVATE KEY/)){
        params = ["rsa",
                  "-in",
                  "/dev/stdin",
                  "-pubout"];
    }else{
        params = ["x509",
                  "-in",
                  "/dev/stdin",
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
                  "/dev/stdin"
                  ];
    spawnOpenSSL(params, certificate, function(err, code, stdout, stderr){
        if (err) {
            return callback(err);
        }
        return fetchCertificateData(stdout, callback);
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
                  "/dev/stdin",
                  "-fingerprint",
                  "-noout"];

    spawnOpenSSL(params, certificate, function(err, code, stdout, stderr){
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

/**
 * Generically spawn openSSL, without processing the result
 *
 * @param {Array}        params   The parameters to pass to openssl
 * @param {String|Array} stdin    Stuff to pass to stdin
 * @param {Function}     callback Called with (error, exitCode, stdout, stderr)
 */
function spawnOpenSSL(params, stdin, callback) {
    var openssl = spawn("openssl", params),
        stdout = "",
        stderr = "",
        pushToStdin = function(){
            var data = stdin.shift();

            if(data){
                openssl.stdin.write(data + "\n");
                if(!stdin.length){
                    openssl.stdin.end();
                }
            }
        };

    if(!callback && typeof stdin == "function"){
        callback = stdin;
        stdin = false;
    }

    if(stdin){
        if(Array.isArray(stdin)){
            pushToStdin();
        }else{
            openssl.stdin.write(stdin);
            openssl.stdin.end();
        }
    }

    openssl.stdout.on('data', function (data) {
        stdout += (data || "").toString("binary");
    });

    openssl.stderr.on('data', function (data) {
        stderr += (data || "").toString("binary");
        if(Array.isArray(stdin)){
            pushToStdin();
        }
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

/**
 * Spawn an openssl command
 */
function execOpenSSL(params, searchStr, stdin, callback){
    if(!callback && typeof stdin == "function"){
        callback = stdin;
        stdin = false;
    }

    spawnOpenSSL(params, stdin, function(err, code, stdout, stderr) {
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
