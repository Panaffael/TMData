import "server-only";

import db from "./sqlite";

import type {
    MapInfo,
    TotdMonth,
    TrackWithMapInfo,
} from "@/lib/trackmania/types";

export type StoredMap = MapInfo & {
    mapperName: string;
};

type TotdSyncState = {
    lastSyncedAt: number;
    isComplete: boolean;
};

type SaveTotdDay = {
    campaignId: number;
    mapUid: string;
    monthDay: number;
    startTimestamp: number;
    mapInfo: MapInfo;
    mapperName: string;
};

type SaveTotdMonthInput = {
    year: number;
    month: number;
    days: SaveTotdDay[];
    isComplete: boolean;
};

type TotdDatabaseRow = {
    campaignId: number;
    mapUid: string;
    monthDay: number;
    startTimestamp: number;
    mapName: string;
    authorAccountId: string;
    mapperName: string;
    authorTime: number;
};

type StoredMapRow = {
    mapUid: string;
    name: string;
    authorAccountId: string;
    mapperName: string;
    authorTime: number;
};

type SyncStateRow = {
    lastSyncedAt: number;
    isComplete: number;
};

const selectTotdMonthStatement = db.prepare(`
    SELECT
        totd_days.campaign_id AS campaignId,
        totd_days.map_uid AS mapUid,
        totd_days.month_day AS monthDay,
        totd_days.start_timestamp AS startTimestamp,
        maps.name AS mapName,
        maps.author_account_id AS authorAccountId,
        maps.mapper_name AS mapperName,
        maps.author_time AS authorTime
    FROM totd_days
    INNER JOIN maps
        ON maps.map_uid = totd_days.map_uid
    WHERE
        totd_days.year = ?
        AND totd_days.month = ?
    ORDER BY totd_days.start_timestamp DESC
`);

const selectMapStatement = db.prepare(`
    SELECT
        map_uid AS mapUid,
        name,
        author_account_id AS authorAccountId,
        mapper_name AS mapperName,
        author_time AS authorTime
    FROM maps
    WHERE map_uid = ?
`);

const selectSyncStateStatement = db.prepare(`
    SELECT
        last_synced_at AS lastSyncedAt,
        is_complete AS isComplete
    FROM sync_state
    WHERE sync_key = ?
`);

const upsertMapStatement = db.prepare(`
    INSERT INTO maps (
        map_uid,
        name,
        author_account_id,
        mapper_name,
        author_time,
        created_at,
        updated_at
    )
    VALUES (
        @mapUid,
        @name,
        @authorAccountId,
        @mapperName,
        @authorTime,
        @now,
        @now
    )
    ON CONFLICT(map_uid)
    DO UPDATE SET
        name = excluded.name,
        author_account_id = excluded.author_account_id,
        mapper_name = excluded.mapper_name,
        author_time = excluded.author_time,
        updated_at = excluded.updated_at
`);

const upsertTotdDayStatement = db.prepare(`
    INSERT INTO totd_days (
        year,
        month,
        month_day,
        campaign_id,
        map_uid,
        start_timestamp,
        created_at,
        updated_at
    )
    VALUES (
        @year,
        @month,
        @monthDay,
        @campaignId,
        @mapUid,
        @startTimestamp,
        @now,
        @now
    )
    ON CONFLICT(
        year,
        month,
        month_day
    )
    DO UPDATE SET
        campaign_id = excluded.campaign_id,
        map_uid = excluded.map_uid,
        start_timestamp = excluded.start_timestamp,
        updated_at = excluded.updated_at
`);

const upsertSyncStateStatement = db.prepare(`
    INSERT INTO sync_state (
        sync_key,
        last_synced_at,
        is_complete
    )
    VALUES (
        @syncKey,
        @lastSyncedAt,
        @isComplete
    )
    ON CONFLICT(sync_key)
    DO UPDATE SET
        last_synced_at = excluded.last_synced_at,
        is_complete = excluded.is_complete
`);

const saveTotdMonthTransaction = db.transaction(
    (input: SaveTotdMonthInput) => {
        const now = Date.now();

        for (const day of input.days) {
            upsertMapStatement.run({
                mapUid: day.mapInfo.uid,
                name: day.mapInfo.name,
                authorAccountId: day.mapInfo.author,
                mapperName: day.mapperName,
                authorTime: day.mapInfo.authorTime,
                now,
            });

            upsertTotdDayStatement.run({
                year: input.year,
                month: input.month,
                monthDay: day.monthDay,
                campaignId: day.campaignId,
                mapUid: day.mapUid,
                startTimestamp: day.startTimestamp,
                now,
            });
        }

        upsertSyncStateStatement.run({
            syncKey: createTotdSyncKey(
                input.year,
                input.month
            ),
            lastSyncedAt: now,
            isComplete: input.isComplete ? 1 : 0,
        });
    }
);

function createTotdSyncKey(
    year: number,
    month: number
): string {
    return `totd:${year}-${String(month).padStart(
        2,
        "0"
    )}`;
}

export function getStoredMap(
    mapUid: string
): StoredMap | null {
    const row = selectMapStatement.get(
        mapUid
    ) as StoredMapRow | undefined;

    if (!row) {
        return null;
    }

    return {
        uid: row.mapUid,
        name: row.name,
        author: row.authorAccountId,
        authorTime: row.authorTime,
        mapperName: row.mapperName,
    };
}

export function getStoredMaps(
    mapUids: string[]
): Map<string, StoredMap> {
    const uniqueMapUids = [
        ...new Set(
            mapUids
                .map((mapUid) => mapUid.trim())
                .filter(Boolean)
        ),
    ];

    const maps = new Map<string, StoredMap>();

    for (const mapUid of uniqueMapUids) {
        const map = getStoredMap(mapUid);

        if (map) {
            maps.set(mapUid, map);
        }
    }

    return maps;
}

export function getStoredTotdMonth(
    year: number,
    month: number
): TotdMonth | null {
    const rows = selectTotdMonthStatement.all(
        year,
        month
    ) as TotdDatabaseRow[];

    if (rows.length === 0) {
        return null;
    }

    const days: TrackWithMapInfo[] = rows.map(
        (row) => ({
            campaignId: row.campaignId,
            mapUid: row.mapUid,
            monthDay: row.monthDay,
            startTimestamp: row.startTimestamp,
            mapperName: row.mapperName,
            mapInfo: {
                uid: row.mapUid,
                name: row.mapName,
                author: row.authorAccountId,
                authorTime: row.authorTime,
            },
        })
    );

    return {
        year,
        month,
        days,
    };
}

export function getTotdSyncState(
    year: number,
    month: number
): TotdSyncState | null {
    const row = selectSyncStateStatement.get(
        createTotdSyncKey(year, month)
    ) as SyncStateRow | undefined;

    if (!row) {
        return null;
    }

    return {
        lastSyncedAt: row.lastSyncedAt,
        isComplete: row.isComplete === 1,
    };
}

export function saveTotdMonth(
    input: SaveTotdMonthInput
): void {
    saveTotdMonthTransaction(input);
}