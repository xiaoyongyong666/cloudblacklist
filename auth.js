const fs = require('fs');
const db = require('./db');
const md5 = require('md5');


async function authenticate(req, res, next) {
    const { username, password } = req.body;

    try {

        const dbuser = await db.getAccountName();
        const dbpwd = await db.getAccountPwd();
        if (username === dbuser.username && md5(password) === dbpwd.password) {
            console.log(2)
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
        res.redirect('/admin/login');
    }
}

module.exports = {
    authenticate,
    checkAdmin
};