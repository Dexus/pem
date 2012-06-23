var spawn = require("child_process").spawn;


function createPrivateKey(bits){
    bits = Number(bits) || 2048;

    var params = ["genrsa",
                  "-rand",
                  "/var/log/mail:/var/log/messages",
                  bits
                  ];
    
    execOpenSSL(params, "RSA PRIVATE KEY", function(error, data){
        
        console.log(error || data);
        
    });
}

function createCSR(options){
    options = options || {};
//openssl req -new -subj '/CN=www.mydom.com/O=My Dom, Inc./C=US/ST=Oregon/L=Portland' -key /dev/stdin
    var params = ["req",
                  "-new",
                  "-sha1",
                  "-subj",
                  "/CN=www.mydom.com/O=My Dom, Inc./C=US/ST=Oregon/L=Portland",
                  "-key",
                  "/dev/stdin"
                  ];
    
    var key = "-----BEGIN RSA PRIVATE KEY-----\n" + 
    		"MIIEpAIBAAKCAQEA1aSTdQoNciIhDkZTukgHQHUY9riGxhXbtYM7zkvM4W1Ergn/\n" + 
    		"yKp9ykzrspec17zCQtb3jAORC46sAszyG6heB4N23yCZWUa21x+lb5w1RCJ37YdC\n" + 
    		"cuasuOzWgGgMtofnbyDUQ3B9g33jQKnO67LCiOmeQlGlixbAWakz0DhJhlIivmdU\n" + 
    		"vuTNgqLy2eU7/m3JDVmXzThlnMQvmfNYHI2ka6JS7KmDUwccG4UPNIau932RRkNN\n" + 
    		"XvcO4mZBfRdZ0oqKrP5ye0t8Fzndqm+H56iN0Ui1+lpJIDLjmOQdlwKKNG8tDHhl\n" + 
    		"ARoTLmKwzKvD75MLunMtnqjZPAmIG56Fok+r9QIDAQABAoIBAG5Vfmn1dRg6lAPB\n" + 
    		"QkB0LnqVfvz8M25dn4hQbDSQZREO02dmdpj1o900eI1VS4UHUPQf/Nxsgx4K4r7X\n" + 
    		"hTnPbDBJLrzxIwE+SfMzvsazT7cObg1Xy3N3ukAO4ICUO+yQp2927uidUdT00MZ2\n" + 
    		"bAzB10HKFRd+/xWj/FbR0ZZ5W09obbr2aYYW3r9KPDptJAN3Pw8BeZkVNvO0XYIQ\n" + 
    		"tJMY7xFf0YwRDVATFbYaEgv99BgUIf+DeA0P+y9BeOUy2pXVy8oGnsJGiFbZx9ZD\n" + 
    		"CwUjiDj7kmypHMIUQ1bkVNc0moMyOZN/AwuhhYP6BtaQdmZ3cv1RnST0IdaWPCo5\n" + 
    		"QigJQYkCgYEA+hgCsuE7rW/psuxJjcsWaE2WaQWjKrBNNmpFIX8wGTPRJtKPUGrZ\n" + 
    		"d2pxGlV4MYJKUQX0ZbqvD5L9mw2+l9aCDqaffyhw04nAsEqXG1PQ9AlepOg4f4jJ\n" + 
    		"x2K/1uztSXWwegCC1otwT9a2RDdRbEWWtZInfFGy6LSOIHxPIBgxJrMCgYEA2rAx\n" + 
    		"zP14cG2paj/cObsGJ79R2BiCEEXTvX2R0IGzguFrCmYsV1r2KGlgQfmTJ/zzhNdb\n" + 
    		"146t3OqYYDGRjCQeInEulRqSFoC4WASe8hcNdXityej5V2LZuPenNIe7p+KD+B7J\n" + 
    		"zdp7ilTRY6OAk7pHauvjPBrVi8K0fVtY7IqP9rcCgYEA91mcAbOGRIk1SEMulFDS\n" + 
    		"fqKOKpzqviPUmgcNDI4w0hxPtef22oBzSQo7huIVmFHWksAi8iJrVin5LcuwP5hm\n" + 
    		"1XqysR8cR/wsWa/MN7j0JwjFVLBggLKXbt4aAsYeAdOmkWPEA9GxaSVg66MSotVI\n" + 
    		"s5gz+V8MZd992l9YGtQSeMUCgYAmexKIS6HBxsok1A/gaLRwkg3IxKc+TcswcMQT\n" + 
    		"uH7p7Nh0//2VcYAXJFO3yD7Iro37NhoHGCgn02/0nURLMJ/M17WmrwI9y3CkrEt7\n" + 
    		"teq8XPvXp5MYeWBuV8WoTKoMpKMsKd7Axk0uzjX6Hm8lj4W5nsBhdydUbHJuDIDd\n" + 
    		"PpSOiQKBgQDMMyCC+qRB8KXEoj6L1kM0rYwamQy2D2fVYfF0Uu2r25ITtR7ZgccN\n" + 
    		"18ncBn8snhcGqAq0dP7/4ehDLctWciTTSsGWWo/+2qsQZn1i6UlqSgNyZWAA+TCF\n" + 
    		"TAGI8Dbt8vEJme1h2Vn5G3JvxqROJ9FCJGCuyHOyXZpdVpbDlrnZGQ==\n" + 
    		"-----END RSA PRIVATE KEY-----";
    
    execOpenSSL(params, "CERTIFICATE REQUEST", key, function(error, data){
        
        console.log(error || data);
        
    });
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
        openssl.stdin.write(stdin);
        openssl.stdin.end();
    }
    
    openssl.stdout.on('data', function (data) {
        stdout += (data || "").toString("binary");
    });

    openssl.stderr.on('data', function (data) {
        stderr += (data || "").toString("binary");
    });

    openssl.on('exit', function (code) {
        var start, end;
        
        //console.log(stdout);
        //console.log(stderr);
        
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
}
createCSR(2048);

