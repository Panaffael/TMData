import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

import Providers from "./providers";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "TMData",
    description: "Trackmania statistics dashboard",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
        <body
            className={`${geistSans.variable} ${geistMono.variable}`}
        >
        <AppRouterCacheProvider>
            <Providers>
                <header className="w-full border-b border-border bg-surface">
                    <nav className="mx-auto flex max-w-6xl items-center gap-8 px-6 py-4">
                        <Link
                            href="/"
                            className="text-lg font-bold"
                        >
                            TMData
                        </Link>

                        <Link
                            href="/player"
                            className="transition-opacity hover:opacity-70"
                        >
                            Players
                        </Link>

                        <Link
                            href="/tracks"
                            className="transition-opacity hover:opacity-70"
                        >
                            Tracks
                        </Link>

                        <Link
                            href="/competition"
                            className="transition-opacity hover:opacity-70"
                        >
                            Competition
                        </Link>
                    </nav>
                </header>

                <main className="mx-auto w-full max-w-6xl">
                    {children}
                </main>
            </Providers>
        </AppRouterCacheProvider>
        </body>
        </html>
    );
}