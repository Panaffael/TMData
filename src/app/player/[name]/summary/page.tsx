type TrophyRanking = {
    accountId: string;
    countPoint: number;
    echelon: number;
    zones?: {
        zoneName: string;
        ranking: {
            position: number;
            length: number;
        };
    }[];
};

type PlayerResult = {
    playerName: string;
    accountId: string;
    trophies: TrophyRanking | null;
};

type ApiResponse = {
    result: PlayerResult[];
};

export default async function SummaryPage({
                                              params,
                                          }: {
    params: Promise<{ name: string }>;
}) {
    const { name } = await params;

    const response = await fetch(
        `http://localhost:3000/api/player/${encodeURIComponent(name)}`,
        {
            cache: "no-store",
        }
    );

    const data: ApiResponse = await response.json();

    const player = data.result?.[0];

    if (!player) {
        return <p>Spieler nicht gefunden.</p>;
    }

    return (
        <div className="border rounded p-4 max-w-xl">
            <h2 className="text-xl font-bold">{player.playerName}</h2>

            <p className="text-sm opacity-80 mt-2">Account ID:</p>
            <p>{player.accountId}</p>

            {player.trophies && (
                <>
                    <div className="mt-6">
                        <h3 className="font-bold">Trophäen</h3>

                        <p>
                            Punkte:{" "}
                            {player.trophies.countPoint.toLocaleString()}
                        </p>

                        <p>Echelon: {player.trophies.echelon}</p>
                    </div>

                    <div className="mt-4">
                        <h3 className="font-bold">Ranking</h3>

                        <ul className="list-disc pl-5">
                            {player.trophies.zones?.map((zone) => (
                                <li key={zone.zoneName}>
                                    {zone.zoneName}: #{zone.ranking.position}
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    );
}