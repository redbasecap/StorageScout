'use client'

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { QrCode, Inbox, Download, Upload, Printer, Package, Clock, Box as BoxesIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item, Box } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import BoxList from '@/components/box-list';
import InventoryStats from '@/components/inventory-stats';
import { useBoxLabels } from '@/hooks/use-box-labels';
import { itemsToCsv, downloadCsv } from '@/lib/export';
import { Skeleton } from '@/components/ui/skeleton';
import RecentItems from '@/components/recent-items';
import ImportCsvDialog from '@/components/import-csv-dialog';
import PrintLabelsDialog from '@/components/print-labels-dialog';
import QrScanner from '@/components/qr-scanner';

export default function MainPage() {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [boxId, setBoxId] = useState('');
  const router = useRouter();

  const { user } = useUser();
  const firestore = useFirestore();

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'items'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);
  const { labels: boxLabels } = useBoxLabels();

  const boxes = useMemo(() => {
      if (!items) return [];

      const groupedByBoxId = items.reduce<Record<string, Box>>((acc, item) => {
          if (!acc[item.boxId]) {
              acc[item.boxId] = { id: item.boxId, items: [], location: item.location };
          }
          acc[item.boxId].items.push(item);
          return acc;
      }, {});

      const sortedBoxes: Box[] = [];
      const seenBoxIds = new Set<string>();

      for (const item of items) {
          if (!seenBoxIds.has(item.boxId)) {
              sortedBoxes.push(groupedByBoxId[item.boxId]);
              seenBoxIds.add(item.boxId);
          }
      }

      return sortedBoxes;
  }, [items]);

  const handleQrScan = useCallback((scannedBoxId: string) => {
    setTimeout(() => {
      router.push(`/box?id=${scannedBoxId}`);
    }, 500);
  }, [router]);

  const handleGoToBox = () => {
    if (boxId) {
      router.push(`/box?id=${boxId}`);
    }
  };

  if (isLoadingItems) {
      return (
          <div className="container mx-auto p-4 md:p-8">
              <div className="flex items-center justify-between mb-8">
                  <Skeleton className="h-9 w-48" />
                  <Skeleton className="h-10 w-36" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {[...Array(4)].map((_, i) => (
                      <div key={i} className="flex flex-col space-y-3">
                          <Skeleton className="h-[150px] w-full rounded-xl" />
                          <div className="space-y-2">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-4 w-1/2" />
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {boxes.length > 0 ? (
            <div>
                {/* Statistics Dashboard */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Boxes</CardTitle>
                      <BoxesIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{boxes.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                      <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{items?.length || 0}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {items?.[0]?.createdAt?.toDate?.()
                          ? new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(items[0].createdAt.toDate())
                          : 'No activity'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Your Boxes</h1>
                    <div className="flex gap-2">
                      {items && items.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => {
                              const csv = itemsToCsv(items);
                              downloadCsv(csv, `storagescout-export-${new Date().toISOString().slice(0, 10)}.csv`);
                            }}
                          >
                            <Download className="mr-2 h-5 w-5" />
                            <span className="hidden sm:inline">Export</span>
                          </Button>
                          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                            <Upload className="mr-2 h-5 w-5" />
                            <span className="hidden sm:inline">Import</span>
                          </Button>
                          <Button variant="outline" onClick={() => setIsPrintOpen(true)}>
                            <Printer className="mr-2 h-5 w-5" />
                            <span className="hidden sm:inline">Labels</span>
                          </Button>
                        </>
                      )}
                      <Button onClick={() => setIsScanModalOpen(true)}>
                          <QrCode className="mr-2 h-5 w-5" />
                          Scan a Box
                      </Button>
                    </div>
                </div>
                {items && items.length > 0 && <RecentItems items={items} />}
                <InventoryStats boxes={boxes} />
                <BoxList boxes={boxes} labelMap={boxLabels} />
            </div>
        ) : (
        <div className="text-center py-16">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary mb-6">
                <Inbox className="h-12 w-12 text-secondary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Your inventory is empty.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Start organizing by scanning your first storage box.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" onClick={() => setIsScanModalOpen(true)}>
                <QrCode className="mr-2 h-5 w-5" />
                Scan a Box
              </Button>
            </div>
        </div>
      )}
      
      <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan Box</DialogTitle>
            <DialogDescription>
              Point your camera at a box&apos;s QR code or enter the UUID manually.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <QrScanner active={isScanModalOpen} onScan={handleQrScan} />
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="box-id" className="text-right">
                Box UUID
              </Label>
              <Input
                id="box-id"
                value={boxId}
                onChange={(e) => setBoxId(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleGoToBox} disabled={!boxId}>Go to Box</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImportCsvDialog open={isImportOpen} onOpenChange={setIsImportOpen} />
      <PrintLabelsDialog
        open={isPrintOpen}
        onOpenChange={setIsPrintOpen}
        boxes={boxes.map((b) => ({ id: b.id, label: boxLabels.get(b.id) }))}
      />
    </div>
  );
}
