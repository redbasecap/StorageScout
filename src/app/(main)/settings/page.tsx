'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  User, Download, Upload, Trash2, Package, Box as BoxIcon,
  MapPin, Tag, Loader2, Printer, Shield,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, writeBatch, doc } from 'firebase/firestore';
import type { Item } from '@/lib/types';
import { itemsToCsv, downloadCsv } from '@/lib/export';
import { calculateInventoryStats } from '@/lib/box-stats';
import ImportCsvDialog from '@/components/import-csv-dialog';
import PrintLabelsDialog from '@/components/print-labels-dialog';
import { useBoxLabels } from '@/hooks/use-box-labels';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { labels: boxLabels } = useBoxLabels();
  const { toast } = useToast();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'items'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: items } = useCollection<Item>(itemsQuery);

  const stats = useMemo(() => {
    if (!items) return null;
    return calculateInventoryStats(items);
  }, [items]);

  const boxes = useMemo(() => {
    if (!items) return [];
    const seen = new Set<string>();
    return items
      .filter((i) => {
        if (seen.has(i.boxId)) return false;
        seen.add(i.boxId);
        return true;
      })
      .map((i) => ({ id: i.boxId, label: boxLabels.get(i.boxId) }));
  }, [items, boxLabels]);

  const handleExport = () => {
    if (!items || items.length === 0) return;
    const csv = itemsToCsv(items);
    downloadCsv(csv, `storagescout-export-${new Date().toISOString().slice(0, 10)}.csv`);
    toast({ title: 'Exported', description: `${items.length} items exported to CSV.` });
  };

  const handleDeleteAll = async () => {
    if (!firestore || !items || items.length === 0) return;
    setIsDeleting(true);
    try {
      const batchSize = 500;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = writeBatch(firestore);
        items.slice(i, i + batchSize).forEach((item) => {
          batch.delete(doc(firestore, 'items', item.id));
        });
        await batch.commit();
      }
      toast({ title: 'All Items Deleted', description: 'Your inventory has been cleared.' });
    } catch (error) {
      console.error('Delete all failed:', error);
      toast({ title: 'Error', description: 'Failed to delete all items.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight mb-8">Settings</h1>

      {/* Profile Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'} />
            <AvatarFallback className="text-lg">
              {user?.displayName?.[0] || user?.email?.[0] || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium">{user?.displayName || 'Anonymous User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email || 'No email'}</p>
            {user?.isAnonymous && (
              <Badge variant="outline" className="mt-1">Self-Hosted (Anonymous)</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Inventory Stats */}
      {stats && stats.totalItems > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Inventory Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalItems}</div>
                <div className="text-xs text-muted-foreground">Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalBoxes}</div>
                <div className="text-xs text-muted-foreground">Boxes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalLocations}</div>
                <div className="text-xs text-muted-foreground">Locations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.totalTags}</div>
                <div className="text-xs text-muted-foreground">Tags</div>
              </div>
            </div>

            {stats.topTags.length > 0 && (
              <>
                <Separator className="my-4" />
                <div>
                  <p className="text-sm font-medium mb-2">Top Tags</p>
                  <div className="flex flex-wrap gap-1">
                    {stats.topTags.map(({ tag, count }) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Data Management */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>Export, import, and manage your inventory data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handleExport} disabled={!items || items.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={() => setIsPrintOpen(true)} disabled={boxes.length === 0}>
              <Printer className="mr-2 h-4 w-4" />
              Print QR Labels
            </Button>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium text-destructive mb-2">Danger Zone</h3>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={!items || items.length === 0 || isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete All Items
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Items?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {items?.length || 0} items from your inventory.
                    This action cannot be undone. Consider exporting first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <PrintLabelsDialog open={isPrintOpen} onOpenChange={setIsPrintOpen} boxes={boxes} />
    </div>
  );
}
