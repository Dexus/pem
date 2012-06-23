var spawn = require("child_process").spawn;

module.exports.createPrivateKey = createPrivateKey;
module.exports.createCSR =createCSR;
module.exports.createCertificate = createCertificate;

function createPrivateKey(keyBitsize, callback){
    keyBitsize = Number(keyBitsize) || 2048;

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
    
    if(!options.serverKey){
        createPrivateKey(options.keyBitsize || 1024, function(error, keyData){
            if(error){
                return callback(error);
            }
            options.serverKey = keyData.key;
            createCertificate(options, callback);
        });
        return;
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

    execOpenSSL(params, "CERTIFICATE", [options.csr, options.serverKey], function(error, data){
        if(error){
            return callback(error);
        }
        var response = {
                csr: options.csr,
                clientKey: options.clientKey,
                certificate: data,
                serverKey: options.serverKey
            }
        return callback(null, response);
    });
}

function generateCSRSubject(options){

    options = options || {};
    
    var csrData = {
            C: options.country || options.C || "",
            ST: options.state || options.ST || "",
            L: options.location || options.L || "",
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