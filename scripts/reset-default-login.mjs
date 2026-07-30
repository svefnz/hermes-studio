#!/usr/bin/env node
/**
 * Reset or create the default admin login for Hermes Studio.
 *
 * Usage:
 *   node scripts/reset-default-login.mjs
 *   # or via Docker:
 *   docker compose exec hermes-studio node scripts/reset-default-login.mjs
 */
import { mkdirSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { randomBytes, scryptSync } from "node:crypto";

const WEB_UI_HOME =
	process.env.HERMES_WEB_UI_HOME?.trim() ||
	process.env.HERMES_WEBUI_STATE_DIR?.trim() ||
	resolve(homedir(), ".hermes-web-ui");
const WEB_UI_DB_FILE = join(WEB_UI_HOME, "hermes-studio.db");
const DEFAULT_USERNAME = "admin";
const DEFAULT_PASSWORD = "123456";

function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	const hash = scryptSync(password, salt, 64).toString("hex");
	return `scrypt:${salt}:${hash}`;
}

async function resetDefaultLogin() {
	mkdirSync(WEB_UI_HOME, { recursive: true });
	const { DatabaseSync } = await import("node:sqlite");
	const db = new DatabaseSync(WEB_UI_DB_FILE);
	try {
		db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        status TEXT NOT NULL DEFAULT 'active',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER
      )
    `);

		const now = Date.now();
		const passwordHash = hashPassword(DEFAULT_PASSWORD);
		const existing = db
			.prepare("SELECT id FROM users WHERE username = ?")
			.get(DEFAULT_USERNAME);
		if (existing?.id) {
			db.prepare(
				`UPDATE users
         SET password_hash = ?, role = 'super_admin', status = 'active', updated_at = ?
         WHERE id = ?`,
			).run(passwordHash, now, existing.id);
			console.log(
				`  ✓ Reset default login: ${DEFAULT_USERNAME} / ${DEFAULT_PASSWORD}`,
			);
		} else {
			db.prepare(
				`INSERT INTO users (username, password_hash, role, status, created_at, updated_at)
         VALUES (?, ?, 'super_admin', 'active', ?, ?)`,
			).run(DEFAULT_USERNAME, passwordHash, now, now);
			console.log(
				`  ✓ Created default login: ${DEFAULT_USERNAME} / ${DEFAULT_PASSWORD}`,
			);
		}
		console.log(`    Database: ${WEB_UI_DB_FILE}`);
	} finally {
		db.close();
	}
}

resetDefaultLogin().catch((err) => {
	console.error(`  ✗ ${err?.message || err}`);
	process.exit(1);
});
