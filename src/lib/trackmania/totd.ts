import "server-only";

import {
    logDone,
    logSection,
    logStep,
} from "@/lib/database/logger";

import {
    getNadeoLiveToken,
    getTrackmaniaOAuthToken,
} from "./auth";

import { getMapInfo } from "./maps";
import { getAccountNames } from "./players";

import {
    getStoredMaps,
    getStoredTotdMonth,
    getTotdSyncState,
    saveTotdMonth,
} from "@/lib/database/totd";

import type {
    MapInfo,
    TotdApiResponse,
    TotdDay,
    TotdMonth,
} from "./types";

const NADEO_LIVE_API_URL =
    "https://live-services.trackmania.nadeo.live/api/token";

const CURRENT_MONTH_SYNC_INTERVAL =
    60 * 60 * 1000;

type TargetMonth = {
    year: number;
    month: number;
};

type DayWithMap = TotdDay & {
    mapInfo: MapInfo;
    mapperName: string;
};

/**
 * Calculates the requested month from the current UTC month and offset.
 */
function getTargetMonth(
    offset: number
): TargetMonth {
    const now = new Date();

    const targetDate = new Date(
        Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() - offset,
            1
        )
    );

    return {
        year: targetDate.getUTCFullYear(),
        month: targetDate.getUTCMonth() + 1,
    };
}

/**
 * Determines whether the requested month must be synchronized.
 */
function shouldSynchronizeMonth(
    offset: number,
    syncState: ReturnType<
        typeof getTotdSyncState
    >
): boolean {
    if (!syncState) {
        return true;
    }

    // Previous months are complete and do not need another API call.
    if (offset > 0) {
        return !syncState.isComplete;
    }

    // The current month is refreshed once per hour.
    return (
        Date.now() - syncState.lastSyncedAt >=
        CURRENT_MONTH_SYNC_INTERVAL
    );
}

/**
 * Loads one TOTD month from the Trackmania API.
 */
async function fetchTotdApiMonth(
    offset: number,
    nadeoLiveToken: string
) {
    logStep("Loading month from Trackmania API");

    const response = await fetch(
        `${NADEO_LIVE_API_URL}/campaign/month?length=1&offset=${offset}`,
        {
            headers: {
                Authorization:
                    `nadeo_v1 t=${nadeoLiveToken}`,
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `TOTD-Monat konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    const data =
        (await response.json()) as TotdApiResponse;

    const month = data.monthList?.[0];

    if (!month) {
        throw new Error(
            "Für diesen Offset wurde kein TOTD-Monat gefunden."
        );
    }

    return month;
}

export async function getTotdMonth(
    offset: number
): Promise<TotdMonth> {
    const validOffset =
        Number.isInteger(offset) && offset >= 0
            ? offset
            : 0;

    logSection("Track of the Day");
    logStep(`Requested month offset: ${validOffset}`);

    const targetMonth = getTargetMonth(validOffset);

    logStep(
        `Requested month: ${String(
            targetMonth.month
        ).padStart(2, "0")}/${targetMonth.year}`
    );

    const storedMonth = getStoredTotdMonth(
        targetMonth.year,
        targetMonth.month
    );

    if (storedMonth) {
        logStep(
            `Found ${storedMonth.days.length} tracks in SQLite`
        );
    } else {
        logStep("Month not found in SQLite");
    }

    const syncState = getTotdSyncState(
        targetMonth.year,
        targetMonth.month
    );

    const synchronizationRequired =
        shouldSynchronizeMonth(
            validOffset,
            syncState
        );

    if (synchronizationRequired) {
        logStep("Synchronization required");
    } else {
        logStep("Synchronization not required");
    }

    if (
        storedMonth &&
        !synchronizationRequired
    ) {
        logDone("Loaded month from SQLite");

        return storedMonth;
    }

    try {
        logStep("Loading Nadeo access token");

        const nadeoLiveToken =
            await getNadeoLiveToken();

        const apiMonth = await fetchTotdApiMonth(
            validOffset,
            nadeoLiveToken
        );

        const days = [...(apiMonth.days ?? [])]
            .filter(
                (day) =>
                    typeof day.mapUid === "string" &&
                    day.mapUid.trim().length > 0
            )
            .sort(
                (firstDay, secondDay) =>
                    secondDay.startTimestamp -
                    firstDay.startTimestamp
            );

        logStep(
            `${days.length} tracks received from the API`
        );

        const storedMaps = getStoredMaps(
            days.map((day) => day.mapUid)
        );

        const missingDays = days.filter(
            (day) => !storedMaps.has(day.mapUid)
        );

        logStep(
            `${storedMaps.size} maps already stored in SQLite`
        );

        logStep(
            `${missingDays.length} maps need to be downloaded`
        );

        if (missingDays.length > 0) {
            logStep("Downloading missing map information");
        }

        const missingMapResults =
            await Promise.all(
                missingDays.map(async (day) => {
                    const mapInfo = await getMapInfo(
                        day.mapUid,
                        nadeoLiveToken
                    );

                    return {
                        day,
                        mapInfo,
                    };
                })
            );

        const validMissingMaps =
            missingMapResults.filter(
                (
                    result
                ): result is {
                    day: TotdDay;
                    mapInfo: MapInfo;
                } => result.mapInfo !== null
            );

        const failedMapCount =
            missingMapResults.length -
            validMissingMaps.length;

        if (failedMapCount > 0) {
            logStep(
                `${failedMapCount} maps could not be downloaded`
            );
        }

        let mapperNames: Record<
            string,
            string
        > = {};

        if (validMissingMaps.length > 0) {
            logStep("Loading Trackmania OAuth token");

            const oauthToken =
                await getTrackmaniaOAuthToken();

            logStep(
                `Loading mapper names for ${validMissingMaps.length} maps`
            );

            mapperNames = await getAccountNames(
                validMissingMaps.map(
                    (result) =>
                        result.mapInfo.author
                ),
                oauthToken
            );
        }

        const fetchedMaps = new Map<
            string,
            {
                mapInfo: MapInfo;
                mapperName: string;
            }
        >();

        for (const result of validMissingMaps) {
            fetchedMaps.set(
                result.day.mapUid,
                {
                    mapInfo: result.mapInfo,
                    mapperName:
                        mapperNames[
                            result.mapInfo.author
                            ] ??
                        result.mapInfo.author,
                }
            );
        }

        const completeDays: DayWithMap[] = [];

        for (const day of days) {
            const storedMap = storedMaps.get(
                day.mapUid
            );

            if (storedMap) {
                completeDays.push({
                    ...day,
                    mapInfo: {
                        uid: storedMap.uid,
                        name: storedMap.name,
                        author: storedMap.author,
                        authorTime:
                        storedMap.authorTime,
                    },
                    mapperName:
                    storedMap.mapperName,
                });

                continue;
            }

            const fetchedMap = fetchedMaps.get(
                day.mapUid
            );

            if (!fetchedMap) {
                continue;
            }

            completeDays.push({
                ...day,
                mapInfo: fetchedMap.mapInfo,
                mapperName:
                fetchedMap.mapperName,
            });
        }

        logStep(
            `Saving ${completeDays.length} tracks to SQLite`
        );

        saveTotdMonth({
            year: apiMonth.year,
            month: apiMonth.month,
            days: completeDays,
            isComplete: validOffset > 0,
        });

        const synchronizedMonth =
            getStoredTotdMonth(
                apiMonth.year,
                apiMonth.month
            );

        if (!synchronizedMonth) {
            throw new Error(
                "Der TOTD-Monat konnte nicht aus SQLite gelesen werden."
            );
        }

        logDone(
            `Synchronization finished with ${synchronizedMonth.days.length} tracks`
        );

        return synchronizedMonth;
    } catch (error) {
        if (storedMonth) {
            console.error(
                "TOTD-Synchronisierung fehlgeschlagen. " +
                "Gespeicherte Daten werden verwendet.",
                error
            );

            logDone(
                "Synchronization failed, loaded stored month from SQLite"
            );

            return storedMonth;
        }

        logDone(
            "Synchronization failed and no stored month is available"
        );

        throw error;
    }
}