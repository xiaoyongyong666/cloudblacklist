/*
 * Copyright (C) [2025] [Starpixel/xiaoyong]
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');
const mysql = require('mysql2/promise');
const db = require('./db');
const auth = require('./auth');
const { marked } = require('marked');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const hljs = require('highlight.js');
const package = require('./package.json');
var cfg = require('./config')

const app = express();
const PORT = process.env.PORT || 3000;

const ACCOUNT_FILE = 'ac.json';
if (!fs.existsSync(ACCOUNT_FILE)) {
    fs.writeFileSync(ACCOUNT_FILE, JSON.stringify({
        username: 'admin',
        password: 'password'
    }, null, 2));
}

marked.setOptions({
    breaks: true,
    gfm: true,
    highlight: function (code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(lang, code).value;
        }
        return hljs.highlightAuto(code).value;
    }
});

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

let isInstalled = fs.existsSync('install.lock');
console.log(`isInstalled: ${isInstalled}`)

const uploadDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use((req, res, next) => {
    if (!isInstalled &&
        req.path !== '/install' &&
        req.path !== '/install-process' &&
        req.path !== '/install-success' &&
        req.path !== '/test-db-connection') {
        return res.redirect('/install');
    }
    next();
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(fileUpload());
app.use(session({
    secret: 'fuckyoudext',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 20 * 60 * 1000 }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.get('/install', (req, res) => {
    if (isInstalled) {
        return res.redirect('/');
    }

    // 提供默认值
    const formData = {
        dbHost: 'localhost',
        dbUser: 'root',
        dbPassword: '',
        dbName: 'cloud_blacklist',
        dbPrefix: 'cb_',
        adminUser: 'admin',
        adminPassword: ''
    };

    res.render('install', { formData });
});

app.post('/install-process', async (req, res) => {
    if (isInstalled) {
        return res.redirect('/');
    }

    const { dbHost, dbUser, dbPassword, dbName, dbPrefix, adminUser, adminPassword } = req.body;

    try {
        // 执行安装过程
        const installResult = await db.installDatabase({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            prefix: dbPrefix
        }, adminUser, adminPassword);

        if (installResult.success) {
            // 创建安装锁定文件
            const lockData = {
                installedAt: new Date().toISOString(),
                dbConfig: {
                    host: dbHost,
                    user: dbUser,
                    database: dbName,
                    prefix: dbPrefix
                }
            };
            fs.writeFileSync('install.lock', JSON.stringify(lockData, null, 2));

            // 重定向到安装成功页面
            isInstalled = true;
            return res.redirect('/install-success');
        } else {
            return res.render('install', {
                error: installResult.error,
                formData: req.body
            });
        }
    } catch (err) {
        return res.render('install', {
            error: `安装过程中发生错误: ${err.message}`,
            formData: req.body
        });
    }
});

app.get('/install-success', (req, res) => {
    if (isInstalled) {
        let user = db
        let config = JSON.parse(fs.readFileSync('./install.lock', 'utf8'))
        res.render('install-success', { package, config, user });
    } else {
        res.redirect('/install');
    }
});

app.post('/test-db-connection', async (req, res) => {
    // 确保只返回JSON响应
    res.setHeader('Content-Type', 'application/json');

    const { dbHost, dbUser, dbPassword, dbName } = req.body;

    // 基本参数验证
    if (!dbHost || !dbUser || !dbName) {
        return res.status(400).json({
            success: false,
            error: "缺少必要的数据库配置参数"
        });
    }

    try {
        // 创建临时连接
        const tempPool = mysql.createPool({
            host: dbHost,
            user: dbUser,
            password: dbPassword || '',
            database: 'mysql', // 连接到默认数据库测试连接
            waitForConnections: true,
            connectionLimit: 1,
            queueLimit: 0
        });

        const connection = await tempPool.getConnection();

        // 测试连接是否有效
        await connection.ping();

        // 测试创建数据库权限
        try {
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
            await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        } catch (createErr) {
            connection.release();
            await tempPool.end();
            return res.json({
                success: false,
                error: `无法创建数据库: ${createErr.message}`
            });
        }

        connection.release();
        await tempPool.end();

        res.json({ success: true });
    } catch (err) {
        console.error('数据库连接测试失败:', err);
        res.json({
            success: false,
            error: `数据库连接失败: ${err.message}`
        });
    }
});

app.get('/', async (req, res) => {
    try {
        const count = await db.getBlacklistCount();
        res.render('index', { count });
    } catch (err) {
        res.status(500).send('服务器错误');
    }
});

app.get('/result', async (req, res) => {
    const { qq, mode = 'default' } = req.query;

    if (!qq) {
        return res.status(400).send('缺少必要参数: qq');
    }

    if (!['default', 'html', 'data'].includes(mode)) {
        return res.status(400).send('无效的mode参数');
    }

    try {
        const data = await db.getBlacklist(qq);
        if (!data) {
            return res.status(200).send('未找到该QQ号的黑名单记录');
        }

        if (mode === 'data') {
            res.json(data);
        } else {
            // 转换Markdown为安全的HTML
            const rawMarkdown = data.content;
            const unsafeHtml = marked.parse(rawMarkdown);
            const safeHtml = DOMPurify.sanitize(unsafeHtml);

            // 添加转换后的HTML到数据对象
            const resultData = {
                ...data,
                contentHtml: safeHtml
            };

            res.render('result', { data: resultData });
        }
    } catch (err) {
        res.status(500).send('服务器错误');
    }
});

app.post('/dext/upload', auth.checkAdmin, async (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).send('没有上传文件');
    }

    const image = req.files.image;
    const ext = path.extname(image.name);
    const filename = `${Date.now()}${ext}`;
    const filepath = path.join(uploadDir, filename);

    try {
        await image.mv(filepath);
        res.json({ success: true, filename });
    } catch (err) {
        res.status(500).send('上传失败');
    }
});

app.get('/dext/images', auth.checkAdmin, async (req, res) => {
    try {
        const files = fs.readdirSync(uploadDir);
        const images = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });

        res.json(images);
    } catch (err) {
        res.status(500).json({ error: '无法读取图片目录' });
    }
});

app.get('/dext/login', (req, res) => {
    res.render('admin/login');
});

app.post('/dext/login', auth.authenticate, (req, res) => {
    res.redirect('/dext');
});

app.get('/dext/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/dext/login');
});

app.use('/dext', auth.checkAdmin);

app.get('/dext', async (req, res) => {
    try {
        const count = await db.getBlacklistCount();
        res.render('admin/dashboard', { count });
    } catch (err) {
        res.status(500).send('服务器错误');
    }
});

app.get('/dext/list', async (req, res) => {
    try {
        const data = await db.getAllBlacklists();
        res.render('admin/list', { data });
    } catch (err) {
        res.status(500).send('服务器错误');
    }
});

app.get('/dext/add', (req, res) => {
    res.render('admin/add');
});

app.post('/dext/add', async (req, res) => {
    const { qq, level, content } = req.body;

    if (!qq || !level || !content) {
        return res.status(400).send('缺少必要参数');
    }

    try {
        await db.addBlacklist({ qq, level, content });
        res.redirect('/dext/list');
    } catch (err) {
        res.status(500).send('添加失败');
    }
});

app.get('/dext/edit', async (req, res) => {
    const { qq } = req.query;

    if (!qq) {
        return res.status(400).send('缺少QQ参数');
    }

    try {
        const data = await db.getBlacklist(qq);
        if (!data) {
            return res.status(404).send('未找到该QQ号的黑名单记录');
        }
        res.render('admin/edit', { data });
    } catch (err) {
        res.status(500).send('服务器错误');
    }
});

app.post('/dext/edit', async (req, res) => {
    const { qq, level, content } = req.body;

    if (!qq || !level || !content) {
        return res.status(400).send('缺少必要参数');
    }

    try {
        await db.updateBlacklist({ qq, level, content });
        res.redirect('/dext/list');
    } catch (err) {
        res.status(500).send('更新失败');
    }
});

app.get('/dext/del', async (req, res) => {
    const { qq } = req.query;

    if (!qq) {
        return res.status(400).send('缺少QQ参数');
    }

    try {
        await db.deleteBlacklist(qq);
        res.redirect('/dext/list');
    } catch (err) {
        res.status(500).send('删除失败');
    }
});

app.use((req, res) => {
    res.status(404).send('404 - 页面未找到');
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    if (!isInstalled) {
        console.log('系统未安装，请访问 http://localhost:3000/install 进行安装');
    }
});