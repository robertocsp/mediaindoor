module.exports.arrayUnique = arrayUnique;
module.exports.arrayDiff = arrayDiff;

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