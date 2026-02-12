'use client';

import type { Box } from '@/lib/types';
import BoxCard from './box-card';
import { Inbox } from 'lucide-react';

type BoxListProps = {
  boxes: Box[];
};

export default function BoxList({ boxes }: BoxListProps) {
  if (boxes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center">
        <Inbox className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Boxes Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Scan a box to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {boxes.map((box) => (
        <BoxCard key={box.id} box={box} />
      ))}
    </div>
  );
}
