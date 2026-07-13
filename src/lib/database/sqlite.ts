import "server-only";

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const configuredPath = process.env.TMDATA_DB_PATH?.trim();

const databasePath =
    configuredPath && configuredPath.length > 0
        ? path.resolve(configuredPath)
        : path.join(process.cwd(), "data", "tmdata.db");

const databaseDirectory = path.dirname(databasePath);

fs.mkdirSync(databaseDirectory, {
    recursive: true,
});

const globalForDatabase = globalThis as unknown as {
    tmdataDatabase?: Database.Database;
};

function createDatabase(): Database.Database {
    const database = new Database(databasePath);

    database.pragma("journal_mode = WAL");
    database.pragma("synchronous = NORMAL");
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");

    database.exec(`
        CREATE TABLE IF NOT EXISTS api_cache (
            cache_key TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            expires_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at
        ON api_cache(expires_at);

        CREATE TABLE IF NOT EXISTS maps (
            map_uid TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            author_account_id TEXT NOT NULL,
            mapper_name TEXT NOT NULL,
            author_time INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_maps_author_account_id
        ON maps(author_account_id);

        CREATE INDEX IF NOT EXISTS idx_maps_mapper_name
        ON maps(mapper_name);

        CREATE TABLE IF NOT EXISTS totd_days (
            year INTEGER NOT NULL,
            month INTEGER NOT NULL,
            month_day INTEGER NOT NULL,
            campaign_id INTEGER NOT NULL,
            map_uid TEXT NOT NULL,
            start_timestamp INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,

            PRIMARY KEY (
                year,
                month,
                month_day
            ),

            FOREIGN KEY (map_uid)
                REFERENCES maps(map_uid)
                ON UPDATE CASCADE
                ON DELETE RESTRICT
        );

        CREATE INDEX IF NOT EXISTS idx_totd_days_month
        ON totd_days(
            year,
            month,
            month_day
        );

        CREATE INDEX IF NOT EXISTS idx_totd_days_map_uid
        ON totd_days(map_uid);

        CREATE INDEX IF NOT EXISTS idx_totd_days_start_timestamp
        ON totd_days(start_timestamp);

        CREATE TABLE IF NOT EXISTS sync_state (
            sync_key TEXT PRIMARY KEY,
            last_synced_at INTEGER NOT NULL,
            is_complete INTEGER NOT NULL DEFAULT 0
        );
    `);

    console.log(`SQLite-Datenbank geöffnet: ${databasePath}`);

    return database;
}

const database =
    globalForDatabase.tmdataDatabase ??
    createDatabase();

if (process.env.NODE_ENV !== "production") {
    globalForDatabase.tmdataDatabase = database;
}

export { databasePath };

export default database;