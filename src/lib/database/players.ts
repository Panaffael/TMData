import "server-only";

import db from "./sqlite";

import type {
    PlayerSearchResult,
} from "@/lib/trackmania/types";

type PlayerDatabaseRow = {
    accountId: string;
    displayName: string;
};

const upsertPlayerStatement = db.prepare(`
    INSERT INTO players (
        account_id,
        display_name,
        created_at,
        updated_at
    )
    VALUES (
        @accountId,
        @displayName,
        @now,
        @now
    )
    ON CONFLICT(account_id)
    DO UPDATE SET
        display_name = excluded.display_name,
        updated_at = excluded.updated_at
`);

const searchPlayersStatement = db.prepare(`
    SELECT
        account_id AS accountId,
        display_name AS displayName
    FROM players
    WHERE display_name LIKE @prefix COLLATE NOCASE
    ORDER BY
        LENGTH(display_name) ASC,
        display_name COLLATE NOCASE ASC
    LIMIT @limit
`);

export function savePlayer(
    accountId: string,
    displayName: string
): void {
    const trimmedAccountId = accountId.trim();
    const trimmedDisplayName = displayName.trim();

    if (!trimmedAccountId || !trimmedDisplayName) {
        return;
    }

    upsertPlayerStatement.run({
        accountId: trimmedAccountId,
        displayName: trimmedDisplayName,
        now: Date.now(),
    });
}

export function searchStoredPlayers(
    query: string,
    limit = 20
): PlayerSearchResult[] {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
        return [];
    }

    const safeLimit = Math.min(
        Math.max(Math.trunc(limit), 1),
        20
    );

    return searchPlayersStatement.all({
        prefix: `${trimmedQuery}%`,
        limit: safeLimit,
    }) as PlayerDatabaseRow[];
}