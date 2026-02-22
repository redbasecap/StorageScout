'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item } from '@/lib/types';
import ItemsList from '@/components/items-list';
import RenameBoxDialog from '@/components/rename-box-dialog';
import { useBoxLabels } from '@/hooks/use-box-labels';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

function BoxPageContent() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get('id') || '';
  const { user } = useUser();
  const firestore = useFirestore();
  const { getLabel, setLabel } = useBoxLabels();
  const [isRenameOpen, setIsRenameOpen] = useState(false);

  const boxLabel = getLabel(uuid);

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !uuid) return null;
    return query(
      collection(firestore, 'items'),
      where('userId', '==', user.uid),
      where('boxId', '==', uuid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore, uuid]);

  const { data: items, isLoading: loading } = useCollection<Item>(itemsQuery);

  if (!uuid) {
    return <div className="container mx-auto p-4">No box ID provided.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">
                {boxLabel || 'Box Contents'}
              </h1>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-primary"
                onClick={() => setIsRenameOpen(true)}
                title="Rename box"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground truncate max-w-sm md:max-w-md font-mono text-sm">
              {uuid}
            </p>
        </div>
        <Link href={`/box/add?id=${uuid}`}>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-[225px] w-full rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <ItemsList items={items || []} />
      )}

      <RenameBoxDialog
        boxId={uuid}
        currentLabel={boxLabel}
        open={isRenameOpen}
        onOpenChange={setIsRenameOpen}
        onSave={setLabel}
      />
    </div>
  );
}

export default function BoxPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Loading...</div>}>
      <BoxPageContent />
    </Suspense>
  );
}
