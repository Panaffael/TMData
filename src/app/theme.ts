"use client";

import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",
        background: {
            default: "#0f172a",
            paper: "#111827",
        },
        primary: {
            main: "#60a5fa",
        },
        text: {
            primary: "#f9fafb",
            secondary: "#9ca3af",
        },
        divider: "#374151",
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: "var(--font-geist-sans), Arial, sans-serif",
    },
});

export default theme;