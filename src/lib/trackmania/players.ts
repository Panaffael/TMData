import "server-only";

import type {
    TrophyRanking,
    TrophyRankingResponse,
} from "./types";

const TRACKMANIA_API_URL =
    "https://api.trackmania.com/api";

const NADEO_LIVE_API_URL =
    "https://live-services.trackmania.nadeo.live/api/token";

export async function getPlayerIds(
    name: string,
    oauthToken: string
): Promise<Record<string, string>> {
    const trimmedName = name.trim();

    if (!trimmedName) {
        return {};
    }

    const params = new URLSearchParams();

    params.append("displayName[]", trimmedName);

    const response = await fetch(
        `${TRACKMANIA_API_URL}/display-names/account-ids?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${oauthToken}`,
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Spieler konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    return response.json();
}

export async function getAccountNames(
    accountIds: string[],
    oauthToken: string
): Promise<Record<string, string>> {
    const uniqueAccountIds = [
        ...new Set(
            accountIds
                .map((accountId) => accountId.trim())
                .filter(Boolean)
        ),
    ];

    if (uniqueAccountIds.length === 0) {
        return {};
    }

    const params = new URLSearchParams();

    for (const accountId of uniqueAccountIds) {
        params.append("accountId[]", accountId);
    }

    const response = await fetch(
        `${TRACKMANIA_API_URL}/display-names?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${oauthToken}`,
            },
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Accountnamen konnten nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    return response.json();
}

export async function getTrophyRanking(
    accountId: string,
    nadeoLiveToken: string
): Promise<TrophyRanking | null> {
    if (!accountId.trim()) {
        return null;
    }

    const response = await fetch(
        `${NADEO_LIVE_API_URL}/leaderboard/trophy/player`,
        {
            method: "POST",
            headers: {
                Authorization:
                    `nadeo_v1 t=${nadeoLiveToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                listPlayer: [
                    {
                        accountId,
                    },
                ],
            }),
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        console.error(
            `Trophäen konnten nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );

        return null;
    }

    const data: TrophyRankingResponse =
        await response.json();

    return data.rankings?.[0] ?? null;
}