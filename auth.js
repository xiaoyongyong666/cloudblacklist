const fs = require('fs');
const path = require('path');
const db = require('./db');
const md5 = require('md5');

const ACCOUNT_FILE = path.join(__dirname, 'ac.json');

function authenticate(req, res, next) {
    const { username, password } = req.body;

    try {

        const dbuser = db.getAccountName();
        const dbpwd = db.getAccountPwd();

        if (username === dbuser && md5(password) === dbpwd) {
            req.session.authenticated = true;
            req.session.username = username;
            next();
        } else {
            res.render('admin/login', { error: '用户名或密码错误' });
        }
    } catch (err) {
        res.status(500).send('认证系统错误');
    }
}

function checkAdmin(req, res, next) {
    if (req.session.authenticated) {
        next();
    } else {
        res.status(404).send('Not Found');
    }
}

module.exports = {
    authenticate,
    checkAdmin
};