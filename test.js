var crypto = require('crypto');

function checksum (str) {
    return crypto
        .createHash('sha256')
        .update(str, 'utf8')
        .digest('hex')
}

const appId = '3563356369163615';
const createdFrom = '2023-08-16T17:00:00.000Z';
const createdTo = '2023-08-17T16:59:59.000Z';
const limit = `100`;
const page = `1`;
const appSecret = '5c5e7b046823cbe070bd6f9f30b1541a96babaf1f9630e5f';

var text = appId.concat(createdFrom, createdTo, limit, page, appSecret);
// var text = appId.concat(appSecret);
// var text = appId.concat(createdFrom, createdTo);
var hash = checksum(text);

console.log(hash)

//9b11b9ff77dbba70fe059acf84c02cfe6af90de9122e4d3bd6ec69c9d637f9ed