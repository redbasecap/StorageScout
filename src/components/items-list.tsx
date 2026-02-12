import type { Item } from '@/lib/types';
import ItemCard from './item-card';
import { Inbox } from 'lucide-react';

type ItemsListProps = {
  items: Item[];
};

export default function ItemsList({ items }: ItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 p-12 text-center">
        <Inbox className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-xl font-semibold">No Items Found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          There are no items in this box or matching your search.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
