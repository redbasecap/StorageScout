'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/hooks/use-auth';
import type { Item } from '@/lib/types';
import ItemsList from '@/components/items-list';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function BoxPage({ params }: { params: { uuid: string } }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const { uuid } = params;

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(
      collection(db, 'items'),
      where('userId', '==', user.uid),
      where('boxId', '==', uuid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData: Item[] = [];
      querySnapshot.forEach((doc) => {
        itemsData.push({ id: doc.id, ...doc.data() } as Item);
      });
      setItems(itemsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, uuid]);

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
        <ItemsList items={items} />
      )}
    </div>
  );
}
