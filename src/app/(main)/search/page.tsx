'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item } from '@/lib/types';
import ItemsList from '@/components/items-list';
import { Skeleton } from '@/components/ui/skeleton';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q');
  const { user } = useUser();
  const firestore = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !q) return null;
    
    // Simple search: Firestore doesn't support native full-text search.
    // This query finds items where the name starts with the search query.
    // For a real app, a third-party service like Algolia or Typesense is recommended.
    return query(
      collection(firestore, 'items'),
      where('userId', '==', user.uid),
      where('name', '>=', q),
      where('name', '<=', q + '\uf8ff'),
      orderBy('name'),
      limit(20)
    );
  }, [user, firestore, q]);

  const { data: items, isLoading: loading } = useCollection<Item>(itemsQuery);

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        {q && <p className="text-muted-foreground">Showing results for: "{q}"</p>}
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

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="container mx-auto p-4 md:p-8">Loading search...</div>}>
            <SearchResults />
        </Suspense>
    )
}
