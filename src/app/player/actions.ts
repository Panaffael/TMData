"use server";

import { searchStoredPlayers } from "@/lib/database/players";

import type {
    PlayerSearchResult,
} from "@/lib/trackmania/types";

export async function searchPlayersAction(
    query: string
): Promise<PlayerSearchResult[]> {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 3) {
        return [];
    }

    return searchStoredPlayers(trimmedQuery, 20);
}