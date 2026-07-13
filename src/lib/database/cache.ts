import "server-only";

import db from "./sqlite";

type CacheEntry<T> = {
    value: T;
};

export function getCache<T>(
    key: string
): T | null {

    const row = db.prepare(`
        SELECT value
        FROM api_cache
        WHERE cache_key = ?
        AND expires_at > ?
    `).get(key, Date.now()) as
        | { value: string }
        | undefined;

    if (!row) {
        return null;
    }

    return (JSON.parse(row.value) as CacheEntry<T>).value;
}

export function setCache<T>(
    key: string,
    value: T,
    ttlSeconds: number
) {

    const now = Date.now();

    db.prepare(`
        INSERT OR REPLACE INTO api_cache
        (
            cache_key,
            value,
            created_at,
            expires_at
        )
        VALUES
        (
            ?,
            ?,
            ?,
            ?
        )
    `).run(
        key,
        JSON.stringify({
            value,
        }),
        now,
        now + ttlSeconds * 1000
    );
}

export function deleteCache(
    key: string
) {

    db.prepare(`
        DELETE
        FROM api_cache
        WHERE cache_key = ?
    `).run(key);
}

export function clearExpiredCache() {

    db.prepare(`
        DELETE
        FROM api_cache
        WHERE expires_at < ?
    `).run(Date.now());
}

export function cacheSize(): number {

    const row = db.prepare(`
        SELECT COUNT(*) AS count
        FROM api_cache
    `).get() as {
        count: number;
    };

    return row.count;
}