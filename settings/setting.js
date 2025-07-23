const fs = require('fs');
const path = require('path');

function getPort() {
    let port = JSON.parse(fs.readFileSync(path.join(__dirname, 'port.json')).toString().trim())
    return port.port
}

module.exports = {
    getPort
}