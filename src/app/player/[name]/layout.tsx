import Link from "next/link";
import {
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from "@mui/material";

export default async function PlayerLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: Promise<{ name: string }>;
}) {
    const { name } = await params;

    return (
        <Box sx={{ p: 4 }}>
            <Typography
                variant="h4"
                component="h1"
                sx={{ fontWeight: 700, mb: 1 }}
            >
                Player
            </Typography>

            <Typography
                variant="body1"
                color="text.secondary"
                sx={{ mb: 4 }}
            >
                {name}
            </Typography>

            <Paper
                variant="outlined"
                sx={{
                    p: 2,
                    mb: 4,
                }}
            >
                <Stack direction="row" spacing={1}>
                    <Link href={`/player/${name}/summary`}>
                        <Button variant="contained">
                            Summary
                        </Button>
                    </Link>

                    <Link href={`/player/${name}/cotd`}>
                        <Button variant="outlined">
                            Cup of the Day
                        </Button>
                    </Link>

                    <Link href={`/player/${name}/trophy-gains`}>
                        <Button variant="outlined">
                            Trophy Gains
                        </Button>
                    </Link>
                </Stack>
            </Paper>

            {children}
        </Box>
    );
}