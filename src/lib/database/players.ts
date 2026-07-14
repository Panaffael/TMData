import "server-only";

import db from "./sqlite";

import type {
    PlayerSearchResult,
} from "@/lib/trackmania/types";

type SavePlayerInput = {
    accountId: string;
    displayName: string;
    countryCode?: string | null;
    countryName?: string | null;
};

type PlayerDatabaseRow = {
    accountId: string;
    displayName: string;
    countryCode: string | null;
    countryName: string | null;
};

const upsertPlayerStatement = db.prepare(`
    INSERT INTO players (
        account_id,
        display_name,
        country_code,
        country_name,
        created_at,
        updated_at
    )
    VALUES (
        @accountId,
        @displayName,
        @countryCode,
        @countryName,
        @now,
        @now
    )
    ON CONFLICT(account_id)
    DO UPDATE SET
        display_name = excluded.display_name,
        country_code = COALESCE(
            excluded.country_code,
            players.country_code
        ),
        country_name = COALESCE(
            excluded.country_name,
            players.country_name
        ),
        updated_at = excluded.updated_at
`);

const searchPlayersStatement = db.prepare(`
    SELECT
        account_id AS accountId,
        display_name AS displayName,
        country_code AS countryCode,
        country_name AS countryName
    FROM players
    WHERE display_name LIKE @prefix COLLATE NOCASE
    ORDER BY
        LENGTH(display_name) ASC,
        display_name COLLATE NOCASE ASC
    LIMIT @limit
`);

export function savePlayer(input: SavePlayerInput): void {
    const accountId = input.accountId.trim();
    const displayName = input.displayName.trim();
    const countryCode =
        input.countryCode?.trim().toUpperCase() || null;
    const countryName = input.countryName?.trim() || null;

    if (!accountId || !displayName) {
        return;
    }

    upsertPlayerStatement.run({
        accountId,
        displayName,
        countryCode,
        countryName,
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