import { NextResponse } from "next/server";

async function getAccessToken() {
    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.TRACKMANIA_CLIENT_ID!,
        client_secret: process.env.TRACKMANIA_CLIENT_SECRET!,
        scope: "read_favorite",
    });

    const response = await fetch("https://api.trackmania.com/api/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    const data = await response.json();
    return data.access_token;
}

async function getNadeoLiveToken() {
    const username = process.env.TM_DEDI_USERNAME;
    const password = process.env.TM_DEDI_PASSWORD;

    if (!username || !password) {
        throw new Error("TM_DEDI_USERNAME oder TM_DEDI_PASSWORD fehlt");
    }

    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

    const response = await fetch(
        "https://prod.trackmania.core.nadeo.online/v2/authentication/token/basic",
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/json",
                "User-Agent": "Raphael Trackmania App",
            },
            body: JSON.stringify({
                audience: "NadeoLiveServices",
            }),
        }
    );

    const text = await response.text();

    console.log("Nadeo Token Status:", response.status);
    console.log("Nadeo Token Antwort:", text);

    if (!response.ok) {
        throw new Error(`Nadeo Token Fehler: ${response.status}`);
    }

    const data = JSON.parse(text);
    return data.accessToken;
}

async function getPlayerIds(name: string, token: string) {
    const url =
        "https://api.trackmania.com/api/display-names/account-ids" +
        `?displayName%5B%5D=${encodeURIComponent(name)}`;

    const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data;
}

async function getTrophyRanking(accountId: string, nadeoLiveToken: string) {
    const response = await fetch(
        "https://live-services.trackmania.nadeo.live/api/token/leaderboard/trophy/player",
        {
            method: "POST",
            headers: {
                Authorization: `nadeo_v1 t=${nadeoLiveToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                listPlayer: [{ accountId }],
            }),
        }
    );

    const text = await response.text();

    console.log("Trophy API Status:", response.status);
    console.log("Trophy API Antwort:", text);

    if (!response.ok) {
        return null;
    }

    const data = JSON.parse(text);
    return data.rankings?.[0] ?? null;
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    try {
        const { name } = await params;

        const token = await getAccessToken();
        const nadeoLiveToken = await getNadeoLiveToken();
        const players = await getPlayerIds(name, token);

        const result = await Promise.all(
            Object.entries(players).map(async ([playerName, accountId]) => {
                const trophies = await getTrophyRanking(
                    accountId as string,
                    nadeoLiveToken
                );

                return {
                    playerName,
                    accountId,
                    trophies,
                };
            })
        );

        return NextResponse.json({
            searchedName: name,
            result,
        });
    } catch (error) {
        console.error("API Route Fehler:", error);

        return NextResponse.json(
            { error: "Spieler oder Trophäen konnten nicht geladen werden" },
            { status: 500 }
        );
    }
}