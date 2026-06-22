import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
    title: "Trackmania Dashboard",
    description: "Trackmania statistics dashboard",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full bg-background text-foreground">
        <Providers>
            <header className="w-full border-b border-border bg-surface">
                <nav className="mx-auto flex max-w-6xl gap-8 px-6 py-4">
                    <Link
                        href="/player"
                        className="font-semibold text-foreground hover:text-primary"
                    >
                        Players
                    </Link>

                    <Link
                        href="/tracks"
                        className="font-semibold text-foreground hover:text-primary"
                    >
                        Tracks
                    </Link>

                    <Link
                        href="/competition"
                        className="font-semibold text-foreground hover:text-primary"
                    >
                        Competition
                    </Link>
                </nav>
            </header>

            <main className="flex-1">{children}</main>
        </Providers>
        </body>
        </html>
    );
}