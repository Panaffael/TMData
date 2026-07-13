"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
    Box,
    Button,
    Paper,
    TextField,
    Typography,
} from "@mui/material";

export default function PlayerPage() {
    const [name, setName] = useState("");
    const router = useRouter();

    function searchPlayer() {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        router.push(
            `/player/${encodeURIComponent(trimmedName)}/summary`
        );
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
                        gap: 2,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Player Name"
                        value={name}
                        onChange={(event) =>
                            setName(event.target.value)
                        }
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                searchPlayer();
                            }
                        }}
                    />

                    <Button
                        variant="contained"
                        onClick={searchPlayer}
                        disabled={!name.trim()}
                        sx={{
                            minWidth: 120,
                        }}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}