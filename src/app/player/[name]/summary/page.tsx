import {
    Alert,
    Box,
    Divider,
    List,
    ListItem,
    ListItemText,
    Paper,
    Typography,
} from "@mui/material";

import { savePlayer } from "@/lib/database/players";

import {
    getNadeoLiveToken,
    getNadeoServicesToken,
    getTrackmaniaOAuthToken,
} from "@/lib/trackmania/auth";

import {
    getPlayerIds,
    getTrophyRanking,
} from "@/lib/trackmania/players";

import { getPlayerCountry } from "@/lib/trackmania/zones";

import type {
    PlayerResult,
} from "@/lib/trackmania/types";

async function getPlayer(
    name: string
): Promise<PlayerResult | null> {
    const [oauthToken, nadeoLiveToken] = await Promise.all([
        getTrackmaniaOAuthToken(),
        getNadeoLiveToken(),
    ]);

    const players = await getPlayerIds(
        name,
        oauthToken
    );

    const player = Object.entries(players)[0];

    if (!player) {
        return null;
    }

    const [playerName, accountId] = player;

    const trophiesPromise = getTrophyRanking(
        accountId,
        nadeoLiveToken
    );

    let countryCode: string | null = null;
    let countryName: string | null = null;

    try {
        const nadeoServicesToken =
            await getNadeoServicesToken();

        const country = await getPlayerCountry(
            accountId,
            nadeoServicesToken
        );

        countryCode = country?.countryCode ?? null;
        countryName = country?.countryName ?? null;
    } catch (error) {
        console.error(
            "Player country could not be loaded.",
            error
        );
    }

    savePlayer({
        accountId,
        displayName: playerName,
        countryCode,
        countryName,
    });

    const trophies = await trophiesPromise;

    return {
        playerName,
        accountId,
        trophies,
    };
}

export default async function SummaryPage({
                                              params,
                                          }: {
    params: Promise<{
        name: string;
    }>;
}) {
    const { name } = await params;

    let player: PlayerResult | null = null;

    try {
        player = await getPlayer(
            decodeURIComponent(name)
        );
    } catch (error) {
        console.error(error);

        return (
            <Alert severity="error">
                Die Spielerdaten konnten nicht geladen werden.
            </Alert>
        );
    }

    if (!player) {
        return (
            <Alert severity="warning">
                Spieler nicht gefunden.
            </Alert>
        );
    }

    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                maxWidth: 800,
            }}
        >
            <Typography
                variant="h4"
                sx={{ fontWeight: 700 }}
            >
                {player.playerName}
            </Typography>

            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 2 }}
            >
                Account ID
            </Typography>

            <Typography
                sx={{
                    wordBreak: "break-all",
                }}
            >
                {player.accountId}
            </Typography>

            <Divider sx={{ my: 3 }} />

            {!player.trophies ? (
                <Alert severity="info">
                    Keine Trophäendaten vorhanden.
                </Alert>
            ) : (
                <>
                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            fontWeight: 700,
                        }}
                    >
                        Trophäen
                    </Typography>

                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {
                                xs: "1fr",
                                md: "1fr 1fr",
                            },
                            gap: 2,
                        }}
                    >
                        <Paper
                            variant="outlined"
                            sx={{ p: 2 }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Punkte
                            </Typography>

                            <Typography variant="h5">
                                {player.trophies.countPoint.toLocaleString(
                                    "de-CH"
                                )}
                            </Typography>
                        </Paper>

                        <Paper
                            variant="outlined"
                            sx={{ p: 2 }}
                        >
                            <Typography
                                variant="body2"
                                color="text.secondary"
                            >
                                Echelon
                            </Typography>

                            <Typography variant="h5">
                                {player.trophies.echelon}
                            </Typography>
                        </Paper>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography
                        variant="h6"
                        sx={{
                            mb: 2,
                            fontWeight: 700,
                        }}
                    >
                        Rankings
                    </Typography>

                    {player.trophies.zones &&
                    player.trophies.zones.length > 0 ? (
                        <List disablePadding>
                            {player.trophies.zones.map(
                                (zone) => (
                                    <ListItem
                                        key={zone.zoneName}
                                        divider
                                    >
                                        <ListItemText
                                            primary={
                                                zone.zoneName
                                            }
                                            secondary={`#${zone.ranking.position.toLocaleString(
                                                "de-CH"
                                            )} von ${zone.ranking.length.toLocaleString(
                                                "de-CH"
                                            )}`}
                                        />
                                    </ListItem>
                                )
                            )}
                        </List>
                    ) : (
                        <Typography color="text.secondary">
                            Keine Rankingdaten vorhanden.
                        </Typography>
                    )}
                </>
            )}
        </Paper>
    );
}