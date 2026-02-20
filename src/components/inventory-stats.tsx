'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Box, Package, MapPin } from 'lucide-react';
import type { Box as BoxType } from '@/lib/types';

type InventoryStatsProps = {
  boxes: BoxType[];
};

export default function InventoryStats({ boxes }: InventoryStatsProps) {
  const totalItems = boxes.reduce((sum, box) => sum + box.items.length, 0);
  const totalBoxes = boxes.length;
  const uniqueLocations = new Set(
    boxes
      .flatMap((box) => box.items.map((item) => item.location))
      .filter(Boolean)
  ).size;

  return (
    <div className="grid gap-4 grid-cols-3 mb-8">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Box className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalBoxes}</p>
            <p className="text-xs text-muted-foreground">
              {totalBoxes === 1 ? 'Box' : 'Boxes'}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalItems}</p>
            <p className="text-xs text-muted-foreground">
              {totalItems === 1 ? 'Item' : 'Items'}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
            <MapPin className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold">{uniqueLocations}</p>
            <p className="text-xs text-muted-foreground">
              {uniqueLocations === 1 ? 'Location' : 'Locations'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
