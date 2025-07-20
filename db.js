const mysql = require('mysql2/promise');
const fs = require('fs');
const md5 = require('md5');
var cfg = require('./config');

if (fs.existsSync('install.lock')) {
    try {
        initPool()
    } catch (err) {
        console.error('读取安装配置失败 请重新安装', err);
    }
}


var pool = null;

function initPool() {
    if (cfg == null) {
        let config = JSON.parse(fs.readFileSync('./install.lock', 'utf8'))
        cfg = config;
        pool = mysql.createPool({
            host: config.dbConfig.host,
            user: config.dbConfig.user,
            password: config.dbConfig.pwd,
            database: config.dbConfig.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        return pool;
    }
    if (!pool) {
        pool = mysql.createPool({
            host: cfg.dbConfig.host,
            user: cfg.dbConfig.user,
            password: cfg.dbConfig.pwd,
            database: cfg.dbConfig.database,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return pool;
}

async function installDatabase(config, adminUser, adminPassword) {
    try {
        let pwd = md5(adminPassword);
        // 创建临时连接（不指定数据库）
        const tempPool = mysql.createPool({
            host: config.host,
            user: config.user,
            password: config.password
        });

        const connection = await tempPool.getConnection();

        // 创建数据库
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);

        // 使用新数据库
        await connection.query(`USE \`${config.database}\``);

        // 创建表
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ${config.prefix}blacklist (
                id INT AUTO_INCREMENT PRIMARY KEY,
                qq VARCHAR(20) NOT NULL UNIQUE,
                level ENUM('high', 'medium', 'low') NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS ${config.prefix}system (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await connection.query(
            `INSERT INTO ${config.prefix}system (username, password) VALUES (?, ?)`,
            [adminUser, pwd]
        )

        connection.release();
        await tempPool.end();

        const lockData = {
            installedAt: new Date().toISOString(),
            dbConfig: {
                host: config.host,
                user: config.user,
                database: config.database,
                prefix: config.prefix,
                pwd: config.password
            }
        };
        fs.writeFileSync('install.lock', JSON.stringify(lockData, null, 2));

        initPool()

        return { success: true };
    } catch (err) {
        console.error('数据库安装错误:', err);
        return {
            success: false,
            error: `数据库安装失败: ${err.message}`
        };
    }
}

function getPool() {
    if (!pool) {
        initPool();
    }
    return pool;
}

// 获取黑名单
async function getBlacklist(qq) {
    try {
        const [rows] = await pool.query(`SELECT * FROM ${cfg.dbConfig.prefix}blacklist WHERE qq = ?`, [qq]);
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
}

// 获取所有黑名单
async function getAllBlacklists() {
    try {
        const [rows] = await pool.query(`SELECT * FROM ${cfg.dbConfig.prefix}blacklist`);
        return rows;
    } catch (err) {
        throw err;
    }
}

// 添加黑名单
async function addBlacklist({ qq, level, content }) {
    try {
        const [result] = await pool.query(
            `INSERT INTO ${cfg.dbConfig.prefix}blacklist (qq, level, content) VALUES (?, ?, ?)`,
            [qq, level, content]
        );
        return result.insertId;
    } catch (err) {
        throw err;
    }
}

// 更新黑名单
async function updateBlacklist({ qq, level, content }) {
    try {
        const [result] = await pool.query(
            `UPDATE ${cfg.dbConfig.prefix}blacklist SET level = ?, content = ? WHERE qq = ?`,
            [level, content, qq]
        );
        return result.affectedRows;
    } catch (err) {
        throw err;
    }
}

// 删除黑名单
async function deleteBlacklist(qq) {
    try {
        const [result] = await pool.query(`DELETE FROM ${cfg.dbConfig.prefix}blacklist WHERE qq = ?`, [qq]);
        return result.affectedRows;
    } catch (err) {
        throw err;
    }
}

// 获取黑名单数量
async function getBlacklistCount() {
    try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${cfg.dbConfig.prefix}blacklist`);
        return rows[0].count;
    } catch (err) {
        throw err;
    }
}

async function getAccountName() {
    try {
        const [rows] = await pool.query(`SELECT username FROM ${cfg.dbConfig.prefix}system`);
        console.log("name")
        console.log(rows)
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
}

async function getAccountPwd() {
    try {
        const [rows] = await pool.query(`SELECT password FROM ${cfg.dbConfig.prefix}system`);
        console.log("pwd")
        console.log(rows)
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
}




module.exports = {
    installDatabase,
    getPool,
    getBlacklist,
    getAllBlacklists,
    addBlacklist,
    updateBlacklist,
    deleteBlacklist,
    getBlacklistCount,
    getAccountName,
    getAccountPwd
};