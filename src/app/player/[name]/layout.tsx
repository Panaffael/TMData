import Link from "next/link";

export default async function PlayerLayout({
                                               children,
                                               params,
                                           }: {
    children: React.ReactNode;
    params: Promise<{ name: string }>;
}) {
    const { name } = await params;

    return (
        <main className="min-h-screen p-8">
            <h1 className="text-3xl font-bold">Player</h1>

            <p className="opacity-80 mb-6">{name}</p>

            <nav className="flex gap-2 mb-8">
                <Link
                    href={`/player/${name}/summary`}
                    className="border rounded px-4 py-2 hover:bg-gray-100"
                >
                    Summary
                </Link>

                <Link
                    href={`/player/${name}/cotd`}
                    className="border rounded px-4 py-2 hover:bg-gray-100"
                >
                    Cup of the Day
                </Link>

                <Link
                    href={`/player/${name}/trophy-gains`}
                    className="border rounded px-4 py-2 hover:bg-gray-100"
                >
                    Trophy Gains
                </Link>
            </nav>

            {children}
        </main>
    );
}