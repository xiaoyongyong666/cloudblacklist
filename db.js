const mysql = require('mysql2/promise');
const fs = require('fs');
const md5 = require('md5');

let dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'cloud_blacklist',
    prefix: 'cb_',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

if (fs.existsSync('install.lock')) {
    try {
        const lockData = JSON.parse(fs.readFileSync('install.lock', 'utf8'));
        // 更新配置而不是重新赋值
        Object.assign(dbConfig, lockData.dbConfig);
    } catch (err) {
        console.error('读取安装配置失败，使用默认配置', err);
    }
}


var pool = null;

function initPool() {
    if (!pool) {
        pool = mysql.createPool(dbConfig);
    }
    return pool;
}

async function installDatabase(config, adminUser, adminPassword) {
    try {
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
            [adminUser, adminPassword]
        )

        connection.release();
        await tempPool.end();

        // 更新全局配置（不重新赋值常量）
        Object.assign(dbConfig, {
            host: config.host,
            user: config.user,
            password: config.password,
            database: config.database
        });

        // 初始化主连接池
        initPool();

        // 创建管理员账户
        const acData = {
            username: adminUser,
            password: adminPassword
        };
        fs.writeFileSync('ac.json', JSON.stringify(acData, null, 2));

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
        const [rows] = await pool.query(`SELECT * FROM ${db.prefix}blacklist WHERE qq = ?`, [qq]);
        return rows[0] || null;
    } catch (err) {
        throw err;
    }
}

// 获取所有黑名单
async function getAllBlacklists() {
    try {
        const [rows] = await pool.query(`SELECT * FROM ${db.prefix}blacklist`);
        return rows;
    } catch (err) {
        throw err;
    }
}

// 添加黑名单
async function addBlacklist({ qq, level, content }) {
    try {
        const [result] = await pool.query(
            `INSERT INTO ${db.prefix}blacklist (qq, level, content) VALUES (?, ?, ?)`,
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
            `UPDATE ${db.prefix}blacklist SET level = ?, content = ? WHERE qq = ?`,
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
        const [result] = await pool.query(`DELETE FROM ${db.prefix}blacklist WHERE qq = ?`, [qq]);
        return result.affectedRows;
    } catch (err) {
        throw err;
    }
}

// 获取黑名单数量
async function getBlacklistCount() {
    try {
        const [rows] = await pool.query(`SELECT COUNT(*) AS count FROM ${db.prefix}blacklist`);
        return rows[0].count;
    } catch (err) {
        throw err;
    }
}

async function getAccount() {
    try {
        const [rows] = await pool.query(`SELECT * FROM ${db.prefix}system`);
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
    getAccount
};