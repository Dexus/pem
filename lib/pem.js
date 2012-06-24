var spawn = require("child_process").spawn;

module.exports.createPrivateKey = createPrivateKey;
module.exports.createCSR =createCSR;
module.exports.createCertificate = createCertificate;
module.exports.readCertificateInfo = readCertificateInfo;
module.exports.getPublicKey = getPublicKey;

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
            }
        return callback(null, response);
        
    });
}

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
                  "/dev/stdin",
                  "-signkey",
                  "/dev/stdin"
                  ];

    execOpenSSL(params, "CERTIFICATE", [options.csr, options.serviceKey], function(error, data){
        if(error){
            return callback(error);
        }
        var response = {
                csr: options.csr,
                clientKey: options.clientKey,
                certificate: data,
                serviceKey: options.serviceKey
            }
        return callback(null, response);
    });
}

function getPublicKey(certificate, callback){
    if(!callback && typeof options == "function"){
        callback = options;
        options = undefined;
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

function readCertificateInfo(certificate, callback){
    if(!callback && typeof options == "function"){
        callback = options;
        options = undefined;
    }
    
    certificate = (certificate || "").toString();
    
    var type = certificate.match(/BEGIN CERTIFICATE REQUEST/)?"req":"x509",
        params = [type,
                  "-noout",
                  "-text",
                  "-in",
                  "/dev/stdin"
                  ],
        openssl = spawn("openssl", params),
        stdout = "",
        stderr = "";
    
    openssl.stdin.write(certificate);
    openssl.stdin.end();
    
    openssl.stdout.on('data', function (data) {
        stdout += (data || "").toString("binary");
    });

    openssl.stderr.on('data', function (data) {
        stderr += (data || "").toString("binary");
    });

    
    openssl.on('exit', function (code) {
        if(code){
            return callback(new Error("Invalid openssl exit code "+code));
        }
        stdout = new Buffer(stdout, "binary").toString("utf-8");
        stderr = new Buffer(stderr, "binary").toString("utf-8");
        
        return fetchCertificateData(stdout, callback);
    });
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

function execOpenSSL(params, searchStr, stdin, callback){
    var openssl = spawn("openssl", params),
        stdout = "",
        stderr = "";
    
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

    openssl.on('exit', function (code) {
        var start, end;
        
        if(code){
            return callback(new Error("Invalid openssl exit code "+code));
        }
        
        stdout = new Buffer(stdout, "binary").toString("utf-8");
        
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
            return callback(new Error(searchStr + " not found from openssl output"));
        }
    });
    
    function pushToStdin(){
        var data = stdin.shift();
        
        if(data){
            openssl.stdin.write(data + "\n");
            if(!stdin.length){
                openssl.stdin.end();
            }
        }
    }
}