const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class SQLiteManager {
    constructor() {
        this.dbPath = path.resolve(__dirname, '../database.db');
        this.db = null;
    }

    initialize() {
        try {

            // 创建新数据库连接
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('数据库连接失败:', err.message);
                    return;
                }
                console.log('成功连接到SQLite数据库');
            });


            // 删除所有表
            
            this.db.run('DROP TABLE IF EXISTS messages', (err) => {
                if (err) {
                    console.error('删除表失败:', err.message);
                }
            });

            this.db.run('DROP TABLE IF EXISTS clients', (err) => {
                if (err) {
                    console.error('删除表失败:', err.message);
                }
            });
            
            // 创建客户端表
            const createClientsTable = `
                CREATE TABLE clients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip TEXT NOT NULL,
                    port INTEGER NOT NULL,
                    UNIQUE(ip, port)
                )`;

            // 创建消息表
            const createMessagesTable = `
                CREATE TABLE messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    clientId INTEGER NOT NULL,
                    timestamp INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    FOREIGN KEY(clientId) 
                        REFERENCES clients(id)
                        ON DELETE CASCADE
                )`;

            // 执行建表语句
            this.db.run(createClientsTable, (err) => {
                if (err) {
                    console.error('客户端表创建失败:', err.message);
                }
            });

            this.db.run(createMessagesTable, (err) => {
                if (err) {
                    console.error('消息表创建失败:', err.message);
                }
            });

        } catch (error) {
            console.error('初始化数据库时出错:', error.message);
        }
    }

    getClientList(callback) {
        const sql = `SELECT id, ip, port FROM clients`;
        this.db.all(sql, [], (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, rows);
        });
    }

    getMessagesByClientId(clientId, callback) {
        const sql = `
            SELECT id, clientId, timestamp, content 
            FROM messages 
            WHERE clientId = ?
            ORDER BY timestamp ASC`;
            
        this.db.all(sql, [clientId], (err, rows) => {
            if (err) {
                return callback(err, null);
            }
            callback(null, rows);
        });
    }

    addMessage(ip, port, content, callback) {
        const timestamp = Date.now();
        
        // 开始事务
        this.db.serialize(() => {
            // 查找或创建客户端记录
            this._getClientId(ip, port, (err, clientId) => {
                if (err) {
                    return callback(err);
                }

                // 插入消息记录
                const sql = `
                    INSERT INTO messages (clientId, timestamp, content)
                    VALUES (?, ?, ?)`;
                    
                this.db.run(sql, [clientId, timestamp, content], function(err) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, this.lastID);
                });
            });
        });
    }

    _getClientId(ip, port, callback) {
        // 查找现有客户端
        const selectSql = `SELECT id FROM clients WHERE ip = ? AND port = ?`;
        
        this.db.get(selectSql, [ip, port], (err, row) => {
            if (err) {
                return callback(err);
            }

            // 如果找到现有客户端
            if (row) {
                return callback(null, row.id);
            }

            // 创建新客户端
            const insertSql = `
                INSERT INTO clients (ip, port)
                VALUES (?, ?)`;
                
            this.db.run(insertSql, [ip, port], function(err) {
                if (err) {
                    return callback(err);
                }
                callback(null, this.lastID);
            });
        });
    }
}

module.exports = new SQLiteManager();