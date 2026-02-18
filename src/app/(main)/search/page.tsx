'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item } from '@/lib/types';
import ItemsList from '@/components/items-list';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q')?.trim() ?? '';
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch all user items and filter client-side for case-insensitive search
  // Firestore doesn't support native full-text or case-insensitive search
  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore || !q) return null;
    return query(
      collection(firestore, 'items'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore, q]);

  const { data: allItems, isLoading: loading } = useCollection<Item>(itemsQuery);

  const filteredItems = useMemo(() => {
    if (!allItems || !q) return [];
    const lower = q.toLowerCase();
    return allItems.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.location?.toLowerCase().includes(lower) ||
        item.boxId.toLowerCase().includes(lower)
    );
  }, [allItems, q]);

  if (!q) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">Enter a search term</h2>
          <p className="text-muted-foreground mt-2">Search across all your items by name, description, or location.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
        <p className="text-muted-foreground">
          {loading
            ? 'Searching...'
            : `${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''} for "${q}"`}
        </p>
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
        <ItemsList items={filteredItems} />
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4 md:p-8">Loading search...</div>}>
      <SearchResults />
    </Suspense>
  );
}
