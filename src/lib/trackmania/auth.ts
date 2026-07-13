import "server-only";

import type {
    NadeoTokenResponse,
    TrackmaniaOAuthResponse,
} from "./types";

const NADEO_AUTH_URL =
    "https://prod.trackmania.core.nadeo.online/v2/authentication/token/basic";

const TRACKMANIA_OAUTH_URL =
    "https://api.trackmania.com/api/access_token";

export async function getNadeoLiveToken(): Promise<string> {
    const username = process.env.TM_DEDI_USERNAME;
    const password = process.env.TM_DEDI_PASSWORD;

    if (!username || !password) {
        throw new Error(
            "TM_DEDI_USERNAME oder TM_DEDI_PASSWORD fehlt."
        );
    }

    const basicAuth = Buffer.from(
        `${username}:${password}`
    ).toString("base64");

    const response = await fetch(NADEO_AUTH_URL, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basicAuth}`,
            "Content-Type": "application/json",
            "User-Agent": "TMData",
        },
        body: JSON.stringify({
            audience: "NadeoLiveServices",
        }),
        cache: "no-store",
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Nadeo-Token konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    const data: NadeoTokenResponse =
        await response.json();

    if (!data.accessToken) {
        throw new Error(
            "Die Nadeo-Antwort enthält kein Access Token."
        );
    }

    return data.accessToken;
}

export async function getTrackmaniaOAuthToken(): Promise<string> {
    const clientId = process.env.TRACKMANIA_CLIENT_ID;
    const clientSecret =
        process.env.TRACKMANIA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "TRACKMANIA_CLIENT_ID oder " +
            "TRACKMANIA_CLIENT_SECRET fehlt."
        );
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
        scope: "read_favorite",
    });

    const response = await fetch(
        TRACKMANIA_OAUTH_URL,
        {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded",
            },
            body,
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `OAuth-Token konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    const data: TrackmaniaOAuthResponse =
        await response.json();

    if (!data.access_token) {
        throw new Error(
            "Die OAuth-Antwort enthält kein Access Token."
        );
    }

    return data.access_token;
}