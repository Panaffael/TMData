"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";
import { useRouter } from "next/navigation";

import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Paper,
    TextField,
    Typography,
} from "@mui/material";

import { searchPlayersAction } from "./actions";

import type {
    PlayerSearchResult,
} from "@/lib/trackmania/types";

import { countryCodeToFlag } from "@/lib/trackmania/countries";

const MINIMUM_SEARCH_LENGTH = 3;
const SEARCH_DELAY_MS = 300;

export default function PlayerPage() {
    const [name, setName] = useState("");
    const [players, setPlayers] = useState<
        PlayerSearchResult[]
    >([]);
    const [loading, setLoading] = useState(false);
    const [searchError, setSearchError] = useState(false);

    const latestRequestId = useRef(0);
    const router = useRouter();

    const trimmedName = name.trim();
    const missingCharacterCount = Math.max(
        MINIMUM_SEARCH_LENGTH - trimmedName.length,
        0
    );

    useEffect(() => {
        const requestId = ++latestRequestId.current;

        if (trimmedName.length < MINIMUM_SEARCH_LENGTH) {
            setPlayers([]);
            setLoading(false);
            setSearchError(false);
            return;
        }

        setLoading(true);
        setSearchError(false);

        const timeout = window.setTimeout(async () => {
            try {
                const results = await searchPlayersAction(
                    trimmedName
                );

                if (requestId === latestRequestId.current) {
                    setPlayers(results);
                }
            } catch (error) {
                console.error(error);

                if (requestId === latestRequestId.current) {
                    setPlayers([]);
                    setSearchError(true);
                }
            } finally {
                if (requestId === latestRequestId.current) {
                    setLoading(false);
                }
            }
        }, SEARCH_DELAY_MS);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [trimmedName]);

    function openPlayer(playerName: string) {
        const trimmedPlayerName = playerName.trim();

        if (!trimmedPlayerName) {
            return;
        }

        router.push(
            `/player/${encodeURIComponent(
                trimmedPlayerName
            )}/summary`
        );
    }

    function searchPlayer() {
        openPlayer(name);
    }

    let helperText = " ";

    if (trimmedName.length === 0) {
        helperText = "Enter at least 3 characters.";
    } else if (missingCharacterCount > 0) {
        helperText = `Enter ${missingCharacterCount} more ${
            missingCharacterCount === 1
                ? "character"
                : "characters"
        }.`;
    } else if (searchError) {
        helperText = "Player suggestions could not be loaded.";
    } else if (!loading && players.length === 0) {
        helperText = "No stored players found. You can still search the exact name.";
    }

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
                Player Search
            </Typography>

            <Paper
                variant="outlined"
                sx={{
                    p: 3,
                    maxWidth: 600,
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        flexDirection: {
                            xs: "column",
                            sm: "row",
                        },
                        alignItems: "flex-start",
                        gap: 2,
                    }}
                >
                    <Autocomplete
                        freeSolo
                        fullWidth
                        options={players}
                        loading={loading}
                        filterOptions={(options) => options}
                        getOptionLabel={(option) =>
                            typeof option === "string"
                                ? option
                                : option.displayName
                        }
                        renderOption={(props, option) => (
                            <li {...props}>
                                <Box
                                    sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                    }}
                                >
                                    {option.countryCode ? (
                                        <Box
                                            component="img"
                                            src={`https://flagcdn.com/24x18/${option.countryCode.toLowerCase()}.png`}
                                            alt=""
                                            sx={{
                                                width: 24,
                                                height: 18,
                                                objectFit: "cover",
                                                flexShrink: 0,
                                            }}
                                        />
                                    ) : (
                                        <Typography
                                            component="span"
                                            sx={{
                                                width: 24,
                                                textAlign: "center",
                                            }}
                                        >
                                            🌐
                                        </Typography>
                                    )}

                                    <Typography component="span">
                                        {option.displayName}
                                    </Typography>
                                </Box>
                            </li>
                        )}
                        isOptionEqualToValue={(option, value) =>
                            option.accountId === value.accountId
                        }
                        inputValue={name}
                        onInputChange={(_, value) => {
                            setName(value);
                        }}
                        onChange={(_, value) => {
                            if (
                                value &&
                                typeof value !== "string"
                            ) {
                                openPlayer(value.displayName);
                            }
                        }}
                        noOptionsText={
                            trimmedName.length <
                            MINIMUM_SEARCH_LENGTH
                                ? "Enter at least 3 characters"
                                : "No stored players found"
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Player Name"
                                helperText={helperText}
                                error={searchError}
                                onKeyDown={(event) => {
                                    if (
                                        event.key === "Enter" &&
                                        players.length === 0
                                    ) {
                                        event.preventDefault();
                                        searchPlayer();
                                    }
                                }}
                            />
                        )}
                    />

                    <Button
                        variant="contained"
                        onClick={searchPlayer}
                        disabled={!trimmedName}
                        sx={{
                            minWidth: 120,
                            mt: {
                                xs: 0,
                                sm: 1,
                            },
                        }}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}