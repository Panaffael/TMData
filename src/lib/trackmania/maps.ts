import "server-only";

import type { MapInfo } from "./types";

const NADEO_LIVE_API_URL =
    "https://live-services.trackmania.nadeo.live/api/token";

export async function getMapInfo(
    mapUid: string,
    nadeoLiveToken: string
): Promise<MapInfo | null> {
    const trimmedMapUid = mapUid.trim();

    if (!trimmedMapUid) {
        return null;
    }

    const response = await fetch(
        `${NADEO_LIVE_API_URL}/map/${encodeURIComponent(
            trimmedMapUid
        )}`,
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

        console.error(
            `Map ${trimmedMapUid} konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );

        return null;
    }

    return response.json();
}