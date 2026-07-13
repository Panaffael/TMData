import "server-only";

import {
    getNadeoLiveToken,
    getTrackmaniaOAuthToken,
} from "./auth";

import { getMapInfo } from "./maps";
import { getAccountNames } from "./players";

import type {
    MapInfo,
    TotdApiResponse,
    TotdDay,
    TotdMonth,
} from "./types";

const NADEO_LIVE_API_URL =
    "https://live-services.trackmania.nadeo.live/api/token";

export async function getTotdMonth(
    offset: number
): Promise<TotdMonth> {
    const validOffset =
        Number.isInteger(offset) && offset >= 0
            ? offset
            : 0;

    const [nadeoLiveToken, oauthToken] =
        await Promise.all([
            getNadeoLiveToken(),
            getTrackmaniaOAuthToken(),
        ]);

    const response = await fetch(
        `${NADEO_LIVE_API_URL}/campaign/month?length=1&offset=${validOffset}`,
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

    const data: TotdApiResponse =
        await response.json();

    const month = data.monthList?.[0];

    if (!month) {
        throw new Error(
            "Für diesen Offset wurde kein TOTD-Monat gefunden."
        );
    }

    const days = [...(month.days ?? [])]
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

    const daysWithMapInfo = await Promise.all(
        days.map(async (day) => {
            const mapInfo = await getMapInfo(
                day.mapUid,
                nadeoLiveToken
            );

            if (!mapInfo) {
                return null;
            }

            return {
                ...day,
                mapInfo,
            };
        })
    );

    const validDays = daysWithMapInfo.filter(
        (
            day
        ): day is TotdDay & {
            mapInfo: MapInfo;
        } => day !== null
    );

    const mapperNames = await getAccountNames(
        validDays.map(
            (day) => day.mapInfo.author
        ),
        oauthToken
    );

    return {
        year: month.year,
        month: month.month,
        days: validDays.map((day) => ({
            ...day,
            mapperName:
                mapperNames[day.mapInfo.author] ??
                day.mapInfo.author,
        })),
    };
}