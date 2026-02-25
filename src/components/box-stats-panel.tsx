'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, Tag, Calendar, Image as ImageIcon } from 'lucide-react';
import type { Item } from '@/lib/types';
import { calculateBoxStats } from '@/lib/box-stats';

type BoxStatsPanelProps = {
  items: Item[];
};

export default function BoxStatsPanel({ items }: BoxStatsPanelProps) {
  const stats = useMemo(() => calculateBoxStats(items), [items]);

  if (stats.totalItems === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium' });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
          <p className="text-xs text-muted-foreground">
            {stats.itemsWithImages} with photos
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.uniqueLocations.length}</div>
          <p className="text-xs text-muted-foreground truncate">
            {stats.uniqueLocations.slice(0, 2).join(', ') || 'No locations set'}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tags</CardTitle>
          <Tag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {stats.allTags.length > 0 ? (
              stats.allTags.slice(0, 5).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag} ({stats.tagCounts[tag]})
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No tags</span>
            )}
            {stats.allTags.length > 5 && (
              <Badge variant="outline" className="text-xs">
                +{stats.allTags.length - 5} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Timeline</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {stats.newestItem ? (
            <>
              <div className="text-sm font-semibold">
                Latest: {dateFormatter.format(stats.newestItem)}
              </div>
              {stats.oldestItem && stats.oldestItem.getTime() !== stats.newestItem.getTime() && (
                <p className="text-xs text-muted-foreground">
                  First: {dateFormatter.format(stats.oldestItem)}
                </p>
              )}
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No dates</span>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
