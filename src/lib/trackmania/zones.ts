import "server-only";

import {
    findCountryByName,
    type PlayerCountry,
} from "./countries";

import type {
    PlayerZoneResponse,
    TrackmaniaZone,
} from "./types";

const CORE_API_URL =
    "https://prod.trackmania.core.nadeo.online";

let zonesPromise: Promise<TrackmaniaZone[]> | null = null;

async function getAllZones(
    nadeoServicesToken: string
): Promise<TrackmaniaZone[]> {
    if (zonesPromise) {
        return zonesPromise;
    }

    zonesPromise = (async () => {
        const response = await fetch(
            `${CORE_API_URL}/zones/`,
            {
                headers: {
                    Authorization:
                        `nadeo_v1 t=${nadeoServicesToken}`,
                },
                cache: "no-store",
            }
        );

        if (!response.ok) {
            const errorText = await response.text();

            throw new Error(
                `Zonen konnten nicht geladen werden: ` +
                `${response.status} ${errorText}`
            );
        }

        return response.json() as Promise<TrackmaniaZone[]>;
    })();

    try {
        return await zonesPromise;
    } catch (error) {
        zonesPromise = null;
        throw error;
    }
}

async function getPlayerZoneId(
    accountId: string,
    nadeoServicesToken: string
): Promise<string | null> {
    const params = new URLSearchParams({
        accountIdList: accountId,
    });

    const response = await fetch(
        `${CORE_API_URL}/accounts/zones/?${params.toString()}`,
        {
            headers: {
                Authorization:
                    `nadeo_v1 t=${nadeoServicesToken}`,
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Spielerzone konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    const data =
        (await response.json()) as PlayerZoneResponse[];

    return data[0]?.zoneId ?? null;
}

function resolveCountryFromHierarchy(
    zoneId: string,
    zones: TrackmaniaZone[]
): PlayerCountry | null {
    const zonesById = new Map(
        zones.map((zone) => [zone.zoneId, zone])
    );

    const visitedZoneIds = new Set<string>();
    let currentZoneId: string | null = zoneId;

    while (
        currentZoneId &&
        !visitedZoneIds.has(currentZoneId)
        ) {
        visitedZoneIds.add(currentZoneId);

        const zone = zonesById.get(currentZoneId);

        if (!zone) {
            return null;
        }

        const country = findCountryByName(zone.name);

        if (country) {
            return country;
        }

        currentZoneId = zone.parentId;
    }

    return null;
}

export async function getPlayerCountry(
    accountId: string,
    nadeoServicesToken: string
): Promise<PlayerCountry | null> {
    const trimmedAccountId = accountId.trim();

    if (!trimmedAccountId) {
        return null;
    }

    const [zoneId, zones] = await Promise.all([
        getPlayerZoneId(
            trimmedAccountId,
            nadeoServicesToken
        ),
        getAllZones(nadeoServicesToken),
    ]);

    if (!zoneId) {
        return null;
    }

    return resolveCountryFromHierarchy(zoneId, zones);
}