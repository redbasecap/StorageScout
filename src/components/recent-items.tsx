'use client';

import type { Item } from '@/lib/types';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin } from 'lucide-react';

type RecentItemsProps = {
  items: Item[];
  limit?: number;
};

export default function RecentItems({ items, limit = 5 }: RecentItemsProps) {
  const recentItems = items.slice(0, limit);

  if (recentItems.length === 0) return null;

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        Recently Added
      </h2>
      <div className="space-y-2">
        {recentItems.map((item) => (
          <Link
            key={item.id}
            href={`/box?id=${item.boxId}`}
            className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
          >
            {item.imageUrl ? (
              <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            ) : (
              <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📦</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{item.name}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {item.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {item.location}
                  </span>
                )}
                {item.createdAt?.toDate && (
                  <span>
                    {new Intl.DateTimeFormat('en', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(item.createdAt.toDate())}
                  </span>
                )}
              </div>
            </div>
            {item.tags && item.tags.length > 0 && (
              <div className="flex gap-1 flex-shrink-0">
                {item.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
