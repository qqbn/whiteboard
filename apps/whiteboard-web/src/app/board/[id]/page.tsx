import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { BoardToolbar } from '@/components/board-toolbar';
import { BoardCanvas } from '@/components/board-canvas';
import { parseBoardIdParam } from '@/lib/board-id';

export default function BoardPage({ params }: PageProps<'/board/[id]'>) {
  return (
    <main className="fixed inset-0 overflow-hidden bg-neutral-50">
      <Suspense fallback={null}>
        <Board params={params} />
      </Suspense>
      <div className="pointer-events-none absolute inset-x-0 top-3 flex justify-center">
        <BoardToolbar />
      </div>
    </main>
  );
}

async function Board({ params }: Pick<PageProps<'/board/[id]'>, 'params'>) {
  const boardId = parseBoardIdParam((await params).id);
  if (!boardId) notFound();
  return <BoardCanvas boardId={boardId} />;
}
