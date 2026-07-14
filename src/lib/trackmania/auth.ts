import "server-only";

import type {
    NadeoTokenResponse,
    TrackmaniaOAuthResponse,
} from "./types";

const NADEO_AUTH_URL =
    "https://prod.trackmania.core.nadeo.online/v2/authentication/token/basic";

const TRACKMANIA_OAUTH_URL =
    "https://api.trackmania.com/api/access_token";

type NadeoAudience =
    | "NadeoServices"
    | "NadeoLiveServices";

type CachedToken = {
    accessToken: string;
    expiresAt: number;
};

const globalForAuth = globalThis as unknown as {
    nadeoServicesToken?: CachedToken;
    nadeoLiveServicesToken?: CachedToken;
};

function getUserAgent(): string {
    return (
        process.env.TM_USER_AGENT?.trim() ||
        "TMData/1.0"
    );
}

function getJwtExpiration(accessToken: string): number {
    try {
        const payload = accessToken.split(".")[1];

        if (!payload) {
            return Date.now() + 10 * 60 * 1000;
        }

        const normalizedPayload = payload
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const decoded = JSON.parse(
            Buffer.from(
                normalizedPayload,
                "base64"
            ).toString("utf8")
        ) as {
            exp?: number;
        };

        if (typeof decoded.exp === "number") {
            return decoded.exp * 1000;
        }
    } catch {
        // Use a conservative fallback if the token cannot be decoded.
    }

    return Date.now() + 10 * 60 * 1000;
}

function isCachedTokenValid(
    cachedToken: CachedToken | undefined
): cachedToken is CachedToken {
    return Boolean(
        cachedToken &&
        cachedToken.expiresAt - 60_000 > Date.now()
    );
}

function getCachedToken(
    audience: NadeoAudience
): CachedToken | undefined {
    return audience === "NadeoServices"
        ? globalForAuth.nadeoServicesToken
        : globalForAuth.nadeoLiveServicesToken;
}

function setCachedToken(
    audience: NadeoAudience,
    token: CachedToken
): void {
    if (audience === "NadeoServices") {
        globalForAuth.nadeoServicesToken = token;
        return;
    }

    globalForAuth.nadeoLiveServicesToken = token;
}

async function getNadeoToken(
    audience: NadeoAudience
): Promise<string> {
    const cachedToken = getCachedToken(audience);

    if (isCachedTokenValid(cachedToken)) {
        return cachedToken.accessToken;
    }

    const username =
        process.env.TM_DEDI_USERNAME?.trim();
    const password =
        process.env.TM_DEDI_PASSWORD;

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
            "User-Agent": getUserAgent(),
        },
        body: JSON.stringify({
            audience,
        }),
        cache: "no-store",
    });

    if (!response.ok) {
        const errorText = await response.text();

        throw new Error(
            `Nadeo-Token für ${audience} konnte nicht geladen werden: ` +
            `${response.status} ${errorText}`
        );
    }

    const data =
        (await response.json()) as NadeoTokenResponse;

    if (!data.accessToken) {
        throw new Error(
            `Die Nadeo-Antwort für ${audience} enthält kein Access Token.`
        );
    }

    setCachedToken(audience, {
        accessToken: data.accessToken,
        expiresAt: getJwtExpiration(data.accessToken),
    });

    return data.accessToken;
}

export function getNadeoLiveToken(): Promise<string> {
    return getNadeoToken("NadeoLiveServices");
}

export function getNadeoServicesToken(): Promise<string> {
    return getNadeoToken("NadeoServices");
}

export async function getTrackmaniaOAuthToken(): Promise<string> {
    const clientId =
        process.env.TRACKMANIA_CLIENT_ID?.trim();
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
            "OAuth-Token konnte nicht geladen werden: " +
            `${response.status} ${errorText}`
        );
    }

    const data =
        (await response.json()) as TrackmaniaOAuthResponse;

    if (!data.access_token) {
        throw new Error(
            "Die OAuth-Antwort enthält kein Access Token."
        );
    }

    return data.access_token;
}