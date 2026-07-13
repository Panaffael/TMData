import {
    Paper,
    Typography,
} from "@mui/material";

export default function CotdPage() {
    return (
        <Paper
            variant="outlined"
            sx={{
                p: 3,
                maxWidth: 700,
            }}
        >
            <Typography
                variant="h5"
                component="h2"
                sx={{ fontWeight: 700 }}
            >
                Cup of the Day
            </Typography>

            <Typography
                color="text.secondary"
                sx={{ mt: 2 }}
            >
                Hier kommen später die COTD-Daten hin.
            </Typography>
        </Paper>
    );
}