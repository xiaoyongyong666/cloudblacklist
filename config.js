const fs = require('fs');
let isInstalled = fs.existsSync('install.lock');
module.exports = isInstalled ? JSON.parse(fs.readFileSync('./install.lock', 'utf8')) : null;