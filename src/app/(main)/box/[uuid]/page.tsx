'use client';

import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item } from '@/lib/types';
import ItemsList from '@/components/items-list';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

import { use } from 'react';

export default function BoxPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = use(params);
  const { user } = useUser();
  const firestore = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'items'),
      where('userId', '==', user.uid),
      where('boxId', '==', uuid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore, uuid]);

  const { data: items, isLoading: loading } = useCollection<Item>(itemsQuery);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Box Contents</h1>
            <p className="text-muted-foreground truncate max-w-sm md:max-w-md">UUID: {uuid}</p>
        </div>
        <Link href={`/box/${uuid}/add`}>
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
    </div>
  );
}
