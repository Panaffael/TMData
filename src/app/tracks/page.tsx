import Link from "next/link";
import type React from "react";

import {
    Alert,
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

import { getTotdMonth } from "@/lib/trackmania/totd";

function getMonthName(month: number): string {
    return new Date(2000, month - 1).toLocaleString(
        "en-US",
        {
            month: "long",
        }
    );
}

function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString(
        "en-US"
    );
}

function formatTime(milliseconds: number): string {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor(
        (milliseconds % 60000) / 1000
    );
    const remainingMilliseconds = milliseconds % 1000;

    return `${minutes}:${seconds
        .toString()
        .padStart(2, "0")}.${remainingMilliseconds
        .toString()
        .padStart(3, "0")}`;
}

function renderTmText(text: string): React.ReactNode[] {
    const parts: React.ReactNode[] = [];

    let color: string | null = null;
    let bold = false;
    let italic = false;
    let index = 0;

    while (index < text.length) {
        if (text[index] === "$") {
            const colorCode = text.slice(
                index + 1,
                index + 4
            );

            if (/^[0-9a-fA-F]{3}$/.test(colorCode)) {
                color = `#${colorCode
                    .split("")
                    .map(
                        (character) =>
                            character + character
                    )
                    .join("")}`;

                index += 4;
                continue;
            }

            const command =
                text[index + 1]?.toLowerCase();

            if (command === "i") {
                italic = true;
                index += 2;
                continue;
            }

            if (command === "o") {
                bold = true;
                index += 2;
                continue;
            }

            if (command === "z") {
                color = null;
                bold = false;
                italic = false;
                index += 2;
                continue;
            }

            index += 2;
            continue;
        }

        let textPart = "";

        while (
            index < text.length &&
            text[index] !== "$"
            ) {
            textPart += text[index];
            index++;
        }

        parts.push(
            <span
                key={parts.length}
                style={{
                    color: color ?? undefined,
                    fontWeight: bold
                        ? "bold"
                        : undefined,
                    fontStyle: italic
                        ? "italic"
                        : undefined,
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
    searchParams: Promise<{
        offset?: string;
    }>;
}) {
    const params = await searchParams;
    const parsedOffset = Number(params.offset ?? 0);

    const offset =
        Number.isInteger(parsedOffset) &&
        parsedOffset >= 0
            ? parsedOffset
            : 0;

    try {
        const totdMonth = await getTotdMonth(offset);
        const tracks = totdMonth.days;

        return (
            <Box sx={{ p: 4 }}>
                <Box
                    sx={{
                        mb: 3,
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            md: "row",
                        },
                        alignItems: {
                            xs: "stretch",
                            md: "center",
                        },
                        justifyContent: "space-between",
                        gap: 2,
                    }}
                >
                    <Typography
                        variant="h4"
                        component="h1"
                        sx={{ fontWeight: 700 }}
                    >
                        Track of the Day
                    </Typography>

                    <Box
                        sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: 1.5,
                        }}
                    >
                        <Link
                            href={`/tracks?offset=${offset + 1}`}
                            style={{
                                textDecoration: "none",
                            }}
                        >
                            <Button variant="outlined">
                                Previous
                            </Button>
                        </Link>

                        <Paper
                            variant="outlined"
                            sx={{
                                px: 4,
                                py: 1,
                                minWidth: 180,
                                textAlign: "center",
                                fontWeight: 700,
                            }}
                        >
                            {getMonthName(
                                totdMonth.month
                            )}{" "}
                            {totdMonth.year}
                        </Paper>

                        {offset > 0 ? (
                            <Link
                                href={`/tracks?offset=${offset - 1}`}
                                style={{
                                    textDecoration: "none",
                                }}
                            >
                                <Button variant="outlined">
                                    Next
                                </Button>
                            </Link>
                        ) : (
                            <Button
                                variant="outlined"
                                disabled
                            >
                                Next
                            </Button>
                        )}
                    </Box>
                </Box>

                {tracks.length === 0 ? (
                    <Alert severity="info">
                        Für diesen Monat wurden keine
                        Strecken gefunden.
                    </Alert>
                ) : (
                    <TableContainer
                        component={Paper}
                        variant="outlined"
                    >
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>
                                        Date
                                    </TableCell>

                                    <TableCell>
                                        Day
                                    </TableCell>

                                    <TableCell>
                                        Map
                                    </TableCell>

                                    <TableCell>
                                        Author Time
                                    </TableCell>

                                    <TableCell>
                                        Players loaded
                                    </TableCell>

                                    <TableCell>
                                        Author Medals loaded
                                    </TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {tracks.map(
                                    (track) => (
                                        <TableRow
                                            key={`${track.campaignId}-${track.monthDay}-${track.startTimestamp}`}
                                            hover
                                        >
                                            <TableCell>
                                                {formatDate(
                                                    track.startTimestamp
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                {
                                                    track.monthDay
                                                }
                                            </TableCell>

                                            <TableCell>
                                                <Box>
                                                    {renderTmText(
                                                        track
                                                            .mapInfo
                                                            .name
                                                    )}
                                                </Box>

                                                <Typography
                                                    variant="body2"
                                                    color="text.secondary"
                                                >
                                                    by{" "}
                                                    {
                                                        track.mapperName
                                                    }
                                                </Typography>
                                            </TableCell>

                                            <TableCell>
                                                {formatTime(
                                                    track
                                                        .mapInfo
                                                        .authorTime
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                —
                                            </TableCell>

                                            <TableCell>
                                                —
                                            </TableCell>
                                        </TableRow>
                                    )
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        );
    } catch (error) {
        console.error(
            "Track-of-the-Day-Daten konnten nicht geladen werden:",
            error
        );

        return (
            <Box sx={{ p: 4 }}>
                <Typography
                    variant="h4"
                    component="h1"
                    sx={{
                        mb: 3,
                        fontWeight: 700,
                    }}
                >
                    Track of the Day
                </Typography>

                <Alert severity="error">
                    Die Track-of-the-Day-Daten konnten
                    nicht geladen werden.
                </Alert>
            </Box>
        );
    }
}