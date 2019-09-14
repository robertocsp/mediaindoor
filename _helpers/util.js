module.exports.arrayUnique = arrayUnique;
module.exports.arrayDiff = arrayDiff;
module.exports.base64Encode = base64Encode;
module.exports.base64Decode = base64Decode;

function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i]+'' === a[j]+'') {
                a.splice(j--, 1);
            }
        }
    }

    return a;
}

function arrayDiff(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        let found = false;
        for(var j=i+1; j<a.length; ++j) {
            if(a[i]+'' === a[j]+'') {
                a.splice(j--, 1);
                found = true;
            }
        }
        if(found) {
            a.splice(i--, 1);
        }
    }

    return a;
}

const fs = require('fs');

// function to encode file data to base64 encoded string
function base64Encode(file) {
    // read binary data
    var bitmap = fs.readFileSync(file);
    // convert binary data to base64 encoded string
    return new Buffer(bitmap).toString('base64');
}

// function to create file from base64 encoded string
function base64Decode(base64str, file) {
    // create buffer object from base64 encoded string, it is important to tell the constructor that the string is base64 encoded
    var bitmap = new Buffer(base64str, 'base64');
    // write buffer to file
    fs.writeFileSync(file, bitmap);
    console.log('******** File created from base64 encoded string ********');
}