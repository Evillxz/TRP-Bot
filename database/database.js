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
                )`,
                `CREATE TABLE IF NOT EXISTS event_registrations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    discord_id TEXT NOT NULL,
                    discord_tag TEXT NOT NULL,
                    game_nick TEXT NOT NULL,
                    game_id TEXT NOT NULL,
                    proof_url TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS register (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_name TEXT NOT NULL,
                    user_discord_name,
                    user_id TEXT NOT NULL,
                    user_game_id TEXT NOT NULL,
                    user_telephone TEXT NOT NULL,
                    user_shift TEXT NOT NULL,
                    rec_id TEXT NOT NULL,
                    approver_id TEXT NOT NULL,
                    approver_tag TEXT NOT NULL,
                    guild_id TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`,
                `CREATE TABLE IF NOT EXISTS raffle (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    discord_name TEXT NOT NULL,
                    discord_tag TEXT NOT NULL,
                    discord_id TEXT NOT NULL,
                    participating BOOLEAN DEFAULT 1,
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

    async addRegister(userName, userTag, userId, userRg, userPhone, userShift, recId, approverId, approverTag, guildId) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO register (user_name, user_discord_name, user_id, user_game_id, user_telephone, user_shift, rec_id, approver_id, approver_tag, guild_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
            this.db.run(query, [userName, userTag, userId, userRg, userPhone, userShift, recId, approverId, approverTag, guildId], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async addRaffle(userDiscordName, userDiscordTag, userId, participating) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO raffle (discord_name, discord_tag, discord_id, participating) VALUES (?, ?, ?, ?)`;
            this.db.run(query, [userDiscordName, userDiscordTag, userId, participating], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async getRaffleUser(userId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM raffle WHERE discord_id = ? LIMIT 1`;
            this.db.get(query, [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
            });
        });
    }

    async toggleRaffleParticipation(userId, participating) {
        return new Promise((resolve, reject) => {
            const query = `UPDATE raffle SET participating = ? WHERE discord_id = ?`;
            this.db.run(query, [participating, userId], function(err) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });
    }

    async getActiveRaffleParticipants() {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM raffle WHERE participating = 1 ORDER BY created_at ASC`;
            this.db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async countActiveRaffleParticipants() {
        return new Promise((resolve, reject) => {
            const query = `SELECT COUNT(*) as count FROM raffle WHERE participating = 1`;
            this.db.get(query, [], (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
            });
        });
    }

    async getRegister(userId, guildId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM register WHERE user_id = ? AND guild_id = ? LIMIT 1`;
            this.db.get(query, [userId, guildId], (err, row) => {
                if (err) reject(err);
                else resolve(row || null);
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

    async getAllWarnings(userId, guildId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM warnings WHERE user_id = ? AND guild_id = ? ORDER BY created_at DESC`;
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

    async isUserRegisteredInEvent(discordId) {
        return new Promise((resolve, reject) => {
            const query = `SELECT id FROM event_registrations WHERE discord_id = ? LIMIT 1`;
            this.db.get(query, [discordId], (err, row) => {
                if (err) reject(err);
                else resolve(!!row);
            });
        });
    }

    async getEventRegistrations() {
        return new Promise((resolve, reject) => {
            const query = `SELECT id, game_nick, game_id, proof_url FROM event_registrations ORDER BY created_at ASC`;
            this.db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async addEventRegistration(discordId, discordTag, gameNick, gameId, proofUrl) {
        return new Promise((resolve, reject) => {
            const query = `INSERT INTO event_registrations (discord_id, discord_tag, game_nick, game_id, proof_url) VALUES (?, ?, ?, ?, ?)`;
            this.db.run(query, [discordId, discordTag, gameNick, gameId, proofUrl], function(err) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });
    }

    async removeEventRegistration(id) {
        return new Promise((resolve, reject) => {
            const query = `DELETE FROM event_registrations WHERE id = ?`;
            this.db.run(query, [id], function(err) {
                if (err) reject(err);
                else resolve(this.changes > 0);
            });
        });
    }

    startExpirationCheck() {
    }
}

module.exports = new Database();