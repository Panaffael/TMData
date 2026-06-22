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
        if (!name.trim()) return;

        router.push(`/player/${encodeURIComponent(name)}/summary`);
    }

    return (
        <Box sx={{ p: 4 }}>
            <Typography
                variant="h4"
                component="h1"
                sx={{
                    fontWeight: 700,
                    mb: 3,
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
                        gap: 2,
                    }}
                >
                    <TextField
                        fullWidth
                        label="Player Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                searchPlayer();
                            }
                        }}
                    />

                    <Button
                        variant="contained"
                        onClick={searchPlayer}
                    >
                        Search
                    </Button>
                </Box>
            </Paper>
        </Box>
    );
}