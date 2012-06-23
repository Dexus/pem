var pem = require(".."),
    testCase = require('nodeunit').testCase;

exports["General Tests"] = {
    "Sample test": function(test){
        
        pem.createCertificate(null, function(error, data){
            test.ifError(error);
            test.ok(data);
            console.log(data);
            test.done();
        });
    }
}