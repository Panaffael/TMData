import Link from "next/link";
import type React from "react";
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

type TotdDay = {
    campaignId: number;
    mapUid: string;
    monthDay: number;
    startTimestamp: number;
};

type MapInfo = {
    uid: string;
    name: string;
    author: string;
    authorTime: number;
};

type TrackWithMapInfo = TotdDay & {
    mapInfo: MapInfo;
    mapperName: string;
};

async function getNadeoLiveToken(): Promise<string> {
    const username = process.env.TM_DEDI_USERNAME;
    const password = process.env.TM_DEDI_PASSWORD;

    if (!username || !password) {
        throw new Error("TM_DEDI_USERNAME or TM_DEDI_PASSWORD is missing");
    }

    const basicAuth = Buffer.from(`${username}:${password}`).toString("base64");

    const res = await fetch(
        "https://prod.trackmania.core.nadeo.online/v2/authentication/token/basic",
        {
            method: "POST",
            headers: {
                Authorization: `Basic ${basicAuth}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ audience: "NadeoLiveServices" }),
            cache: "no-store",
        }
    );

    if (!res.ok) {
        throw new Error("Nadeo token could not be loaded");
    }

    const data = await res.json();
    return data.accessToken;
}

async function getTrackmaniaOAuthToken(): Promise<string> {
    const clientId = process.env.TRACKMANIA_CLIENT_ID;
    const clientSecret = process.env.TRACKMANIA_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error(
            "TRACKMANIA_CLIENT_ID or TRACKMANIA_CLIENT_SECRET is missing"
        );
    }

    const body = new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
    });

    const res = await fetch("https://api.trackmania.com/api/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("OAuth token could not be loaded");
    }

    const data = await res.json();
    return data.access_token;
}

async function getMapInfo(
    mapUid: string,
    token: string
): Promise<MapInfo | null> {
    const res = await fetch(
        `https://live-services.trackmania.nadeo.live/api/token/map/${mapUid}`,
        {
            headers: {
                Authorization: `nadeo_v1 t=${token}`,
            },
            cache: "no-store",
        }
    );

    if (!res.ok) {
        return null;
    }

    return res.json();
}

async function getAccountNames(
    accountIds: string[],
    oauthToken: string
): Promise<Record<string, string>> {
    const uniqueIds = [...new Set(accountIds.filter(Boolean))];

    if (uniqueIds.length === 0) {
        return {};
    }

    const params = new URLSearchParams();

    uniqueIds.forEach((id) => {
        params.append("accountId[]", id);
    });

    const res = await fetch(
        `https://api.trackmania.com/api/display-names?${params.toString()}`,
        {
            headers: {
                Authorization: `Bearer ${oauthToken}`,
            },
            cache: "no-store",
        }
    );

    if (!res.ok) {
        return {};
    }

    return res.json();
}

async function getTotdMonth(offset: number): Promise<{
    year: number;
    month: number;
    days: TrackWithMapInfo[];
}> {
    const nadeoToken = await getNadeoLiveToken();
    const oauthToken = await getTrackmaniaOAuthToken();

    const res = await fetch(
        `https://live-services.trackmania.nadeo.live/api/token/campaign/month?length=1&offset=${offset}`,
        {
            headers: {
                Authorization: `nadeo_v1 t=${nadeoToken}`,
            },
            cache: "no-store",
        }
    );

    if (!res.ok) {
        throw new Error("TOTD could not be loaded");
    }

    const data = await res.json();
    const month = data.monthList[0];

    const days: TotdDay[] = month.days
        .filter((track: TotdDay) => track.mapUid && track.mapUid.trim() !== "")
        .sort((a: TotdDay, b: TotdDay) => b.startTimestamp - a.startTimestamp);

    const daysWithMapInfo = await Promise.all(
        days.map(async (day) => {
            const mapInfo = await getMapInfo(day.mapUid, nadeoToken);

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
        (day): day is TotdDay & { mapInfo: MapInfo } => day !== null
    );

    const mapperNames = await getAccountNames(
        validDays.map((day) => day.mapInfo.author),
        oauthToken
    );

    return {
        year: month.year,
        month: month.month,
        days: validDays.map((day) => ({
            ...day,
            mapperName: mapperNames[day.mapInfo.author] ?? day.mapInfo.author,
        })),
    };
}

function getMonthName(month: number): string {
    return new Date(2026, month - 1).toLocaleString("en-US", {
        month: "long",
    });
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString("en-US");
}

function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = ms % 1000;

    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds
        .toString()
        .padStart(3, "0")}`;
}

function renderTmText(text: string) {
    const parts: React.ReactNode[] = [];
    let color: string | null = null;
    let bold = false;
    let italic = false;
    let i = 0;

    while (i < text.length) {
        if (text[i] === "$") {
            const code = text.slice(i + 1, i + 4);

            if (/^[0-9a-fA-F]{3}$/.test(code)) {
                color = `#${code
                    .split("")
                    .map((c) => c + c)
                    .join("")}`;
                i += 4;
                continue;
            }

            const command = text[i + 1];

            if (command === "i") {
                italic = true;
                i += 2;
                continue;
            }

            if (command === "o") {
                bold = true;
                i += 2;
                continue;
            }

            if (command === "z") {
                color = null;
                bold = false;
                italic = false;
                i += 2;
                continue;
            }

            i += 2;
            continue;
        }

        let textPart = "";

        while (i < text.length && text[i] !== "$") {
            textPart += text[i];
            i++;
        }

        parts.push(
            <span
                key={parts.length}
                style={{
                    color: color ?? undefined,
                    fontWeight: bold ? "bold" : undefined,
                    fontStyle: italic ? "italic" : undefined,
                }}
            >
                {textPart}
            </span>
        );
    }

    return parts;
}

export default async function TracksPage({
                                             searchParams,
                                         }: {
    searchParams: Promise<{ offset?: string }>;
}) {
    const params = await searchParams;
    const offset = Number(params.offset ?? 0);

    const totdMonth = await getTotdMonth(offset);
    const tracks = totdMonth.days;

    return (
        <Box sx={{ p: 4 }}>
            <Box
                sx={{
                    mb: 3,
                    display: "flex",
                    flexDirection: { xs: "column", md: "row" },
                    alignItems: { xs: "stretch", md: "center" },
                    justifyContent: "space-between",
                    gap: 2,
                }}
            >
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                    Track of the Day
                </Typography>

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                    }}
                >
                    <Link href={`/tracks?offset=${offset + 1}`}>
                        <Button variant="outlined">Previous</Button>
                    </Link>

                    <Paper
                        variant="outlined"
                        sx={{
                            px: 4,
                            py: 1,
                            fontWeight: 700,
                            textAlign: "center",
                            minWidth: 180,
                        }}
                    >
                        {getMonthName(totdMonth.month)} {totdMonth.year}
                    </Paper>

                    {offset > 0 && (
                        <Link href={`/tracks?offset=${offset - 1}`}>
                            <Button variant="outlined">Next</Button>
                        </Link>
                    )}
                </Box>
            </Box>

            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Day</TableCell>
                            <TableCell>Map</TableCell>
                            <TableCell>Author Time</TableCell>
                            <TableCell>Players loaded</TableCell>
                            <TableCell>Author Medals loaded</TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {tracks.map((track) => (
                            <TableRow
                                key={`${track.campaignId}-${track.monthDay}-${track.startTimestamp}`}
                                hover
                            >
                                <TableCell>
                                    {formatDate(track.startTimestamp)}
                                </TableCell>

                                <TableCell>{track.monthDay}</TableCell>

                                <TableCell>
                                    <Box>{renderTmText(track.mapInfo.name)}</Box>
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        by {track.mapperName}
                                    </Typography>
                                </TableCell>

                                <TableCell>
                                    {formatTime(track.mapInfo.authorTime)}
                                </TableCell>

                                <TableCell />

                                <TableCell />
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}