import Link from 'next/link';

export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <Link href="/board/demo" className="text-blue-600 underline">
        Open demo board
      </Link>
    </main>
  );
}
