const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const logger = require('../config/logger');
const chalk = require('chalk');

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const dbPath = path.join(__dirname, 'bot.db');
            this.db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    logger.info(`${chalk.green.bold(`[DATABASE]`)} Conectado ao banco de dados!`);
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    async createTables() {
        return new Promise((resolve, reject) => {
            const queries = [
                `CREATE TABLE IF NOT EXISTS bans (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    user_tag TEXT NOT NULL,
                    admin_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS kicks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    user_tag TEXT NOT NULL,
                    admin_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`
            ];

            let completed = 0;
            queries.forEach(query => {
                this.db.run(query, (err) => {
                    if (err) reject(err);
                    completed++;
                    if (completed === queries.length) resolve();
                });
            });
        });
    }

    async addBan(userId, userTag, adminId, guildId, reason) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO bans (user_id, user_tag, admin_id, guild_id, reason) VALUES (?, ?, ?, ?, ?)`;
            this.db.run(query, [userId, userTag, adminId, guildId, reason], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getBans(guildId, limit = 10) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM bans WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?`;
            this.db.all(query, [guildId, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = new Database();