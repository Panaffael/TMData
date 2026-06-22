"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerPage() {
    const [name, setName] = useState("");
    const router = useRouter();

    function searchPlayer() {
        if (!name.trim()) return;

        router.push(`/player/${encodeURIComponent(name)}/summary`);
    }

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold mb-6">Player Search</h1>

            <div className="flex gap-2">
                <input
                    className="border rounded px-4 py-2 text-black"
                    placeholder="Spielername suchen..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") searchPlayer();
                    }}
                />

                <button
                    onClick={searchPlayer}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Suchen
                </button>
            </div>
        </main>
    );
}