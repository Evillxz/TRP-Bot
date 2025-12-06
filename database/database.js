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
                    this.createTables().then(() => {
                        this.startExpirationCheck();
                        resolve();
                    }).catch(reject);
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
                )`,
                `CREATE TABLE IF NOT EXISTS warnings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id TEXT NOT NULL,
                    user_tag TEXT NOT NULL,
                    admin_id TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    reason TEXT NOT NULL,
                    duration_hours INTEGER,
                    expires_at DATETIME,
                    is_active BOOLEAN DEFAULT 1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS up_reb_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    action_type TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    user_tag TEXT NOT NULL,
                    admin_id TEXT NOT NULL,
                    admin_tag TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    old_role_id TEXT NOT NULL,
                    new_role_id TEXT NOT NULL,
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

    async addWarning(userId, userTag, adminId, guildId, reason, durationHours) {
        return new Promise((resolve, reject) => {
            const now = new Date();
            const expiresAt = durationHours ? 
                new Date(now.getTime() + durationHours * 60 * 60 * 1000).toISOString() : null;
            const query = `INSERT INTO warnings (user_id, user_tag, admin_id, guild_id, reason, duration_hours, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(query, [userId, userTag, adminId, guildId, reason, durationHours, expiresAt], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getActiveWarnings(userId, guildId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? AND is_active = 1 ORDER BY created_at DESC`;
            this.db.all(query, [userId, guildId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async expireWarnings() {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const query = `UPDATE warnings SET is_active = 0 WHERE expires_at IS NOT NULL AND expires_at <= ? AND is_active = 1`;
            this.db.run(query, [now], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async getExpiredWarnings() {
        return new Promise((resolve, reject) => {
            const now = new Date().toISOString();
            const query = `SELECT * FROM warnings WHERE expires_at IS NOT NULL AND expires_at <= ? AND is_active = 1`;
            this.db.all(query, [now], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async clearUserWarnings(userId, guildId) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE warnings SET is_active = 0 WHERE user_id = ? AND guild_id = ? AND is_active = 1`;
            this.db.run(query, [userId, guildId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async markWarningInactive(warningId) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE warnings SET is_active = 0 WHERE id = ?`;
            this.db.run(query, [warningId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async addUpRebLog(actionType, userId, userTag, adminId, adminTag, guildId, oldRoleId, newRoleId, reason) {
        return new Promise((resolve, reject) => {
            const query = `
                INSERT INTO up_reb_logs 
                (action_type, user_id, user_tag, admin_id, admin_tag, guild_id, old_role_id, new_role_id, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            this.db.run(
                query,
                [actionType, userId, userTag, adminId, adminTag, guildId, oldRoleId, newRoleId, reason],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getUpRebLogs(guildId, limit = 20) {
        return new Promise((resolve, reject) => {
            const query = `
                SELECT *
                FROM up_reb_logs
                WHERE guild_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            `;

            this.db.all(query, [guildId, limit], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    startExpirationCheck() {
    }
}

module.exports = new Database();