'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item } from '@/lib/types';
import { collection, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import { getLocationSummaries, type LocationSummary } from '@/lib/locations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, Boxes, Package, Pencil, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LocationsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [renameTarget, setRenameTarget] = useState<LocationSummary | null>(null);
  const [newLocationName, setNewLocationName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'items'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: items, isLoading } = useCollection<Item>(itemsQuery);

  const locationSummaries = useMemo(() => {
    if (!items) return [];
    return getLocationSummaries(items);
  }, [items]);

  const unlocatedCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => !i.location?.trim()).length;
  }, [items]);

  const handleRename = async () => {
    if (!renameTarget || !newLocationName.trim() || !firestore || !items) return;
    setIsRenaming(true);
    try {
      const batch = writeBatch(firestore);
      const affectedItems = items.filter(
        (i) => i.location?.trim() === renameTarget.name
      );
      for (const item of affectedItems) {
        batch.update(doc(firestore, 'items', item.id), {
          location: newLocationName.trim(),
        });
      }
      await batch.commit();
      toast({
        title: 'Location renamed',
        description: `Updated ${affectedItems.length} items from "${renameTarget.name}" to "${newLocationName.trim()}"`,
      });
      setRenameTarget(null);
      setNewLocationName('');
    } catch (error) {
      console.error('Rename failed:', error);
      toast({
        title: 'Rename failed',
        description: 'Could not rename location. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <Skeleton className="h-9 w-48 mb-8" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">
            {locationSummaries.length} location{locationSummaries.length !== 1 ? 's' : ''} ·{' '}
            {items?.length || 0} total items
          </p>
        </div>
      </div>

      {locationSummaries.length === 0 && unlocatedCount === 0 ? (
        <div className="text-center py-16">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold">No locations yet</h2>
          <p className="text-muted-foreground mt-2">
            Add locations to your items to see them organized here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locationSummaries.map((loc) => (
            <Card key={loc.name} className="group">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
                    <CardTitle className="text-lg truncate">{loc.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => {
                      setRenameTarget(loc);
                      setNewLocationName(loc.name);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    <span>
                      {loc.itemCount} {loc.itemCount === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Boxes className="h-4 w-4" />
                    <span>
                      {loc.boxIds.length} {loc.boxIds.length === 1 ? 'box' : 'boxes'}
                    </span>
                  </div>
                </div>
                {loc.boxIds.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {loc.boxIds.slice(0, 5).map((id) => (
                      <Link key={id} href={`/box?id=${id}`}>
                        <Badge variant="secondary" className="font-mono text-xs cursor-pointer hover:bg-primary/10">
                          {id.substring(0, 8)}
                        </Badge>
                      </Link>
                    ))}
                    {loc.boxIds.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{loc.boxIds.length - 5} more
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {unlocatedCount > 0 && (
            <Card className="border-dashed">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg text-muted-foreground">No Location</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  <span>
                    {unlocatedCount} {unlocatedCount === 1 ? 'item' : 'items'} without a location
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Location</DialogTitle>
            <DialogDescription>
              This will update the location for all {renameTarget?.itemCount} item
              {renameTarget?.itemCount !== 1 ? 's' : ''} in &ldquo;{renameTarget?.name}&rdquo;.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="New location name"
              onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              disabled={isRenaming || !newLocationName.trim() || newLocationName.trim() === renameTarget?.name}
            >
              {isRenaming ? 'Renaming...' : 'Rename'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
