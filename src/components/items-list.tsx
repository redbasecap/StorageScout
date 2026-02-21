'use client';

import { useState, useMemo, useCallback } from 'react';
import type { Item } from '@/lib/types';
import ItemCard from './item-card';
import ImageLightbox from './image-lightbox';
import SortFilterBar, { type SortField, type SortDirection } from './sort-filter-bar';
import { sortItems, filterItems } from '@/lib/sort-filter';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Inbox, Trash2, CheckSquare, Square } from 'lucide-react';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

type ItemsListProps = {
  items: Item[];
  showSortFilter?: boolean;
};

export default function ItemsList({ items, showSortFilter = true }: ItemsListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterText, setFilterText] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();

  const processed = useMemo(() => {
    const filtered = filterItems(items, filterText);
    return sortItems(filtered, sortField, sortDirection);
  }, [items, filterText, sortField, sortDirection]);

  const lightboxImages = useMemo(
    () =>
      processed
        .filter((item) => item.imageUrl)
        .map((item) => ({ url: item.imageUrl, alt: item.name, id: item.id })),
    [processed]
  );

  const handleImageClick = useCallback(
    (itemId: string) => {
      const idx = lightboxImages.findIndex((img) => img.id === itemId);
      if (idx >= 0) {
        setLightboxIndex(idx);
        setLightboxOpen(true);
      }
    },
    [lightboxImages]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(processed.map((item) => item.id)));
  }, [processed]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBulkDelete = async () => {
    if (!firestore || !firebaseApp || selectedIds.size === 0) return;
    setIsBulkDeleting(true);
    const storage = getStorage(firebaseApp);
    let deleted = 0;

    for (const id of selectedIds) {
      try {
        const item = items.find((i) => i.id === id);
        if (item?.imageUrl?.includes('firebasestorage.googleapis.com')) {
          try {
            await deleteObject(ref(storage, item.imageUrl));
          } catch {
            // Image might already be deleted
          }
        }
        await deleteDoc(doc(firestore, 'items', id));
        deleted++;
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }

    toast({
      title: 'Items Deleted',
      description: `${deleted} item${deleted !== 1 ? 's' : ''} removed.`,
    });

    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setIsBulkDeleting(false);
    setIsBulkDeleteOpen(false);
  };

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
    <div>
      {showSortFilter && (
        <SortFilterBar
          sortField={sortField}
          sortDirection={sortDirection}
          filterText={filterText}
          onSortFieldChange={setSortField}
          onSortDirectionToggle={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
          onFilterTextChange={setFilterText}
          itemCount={processed.length}
        />
      )}

      {/* Batch selection toolbar */}
      <div className="flex items-center gap-2 mb-4">
        {!isSelectionMode ? (
          <Button variant="outline" size="sm" onClick={() => setIsSelectionMode(true)}>
            <CheckSquare className="mr-2 h-4 w-4" />
            Select
          </Button>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              <Square className="mr-2 h-4 w-4" />
              Deselect
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              disabled={selectedIds.size === 0}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedIds.size})
            </Button>
            <Button variant="ghost" size="sm" onClick={exitSelectionMode}>
              Cancel
            </Button>
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {processed.map((item) => (
          <ItemCard
            key={item.id}
            item={item}
            selectionMode={isSelectionMode}
            selected={selectedIds.has(item.id)}
            onSelect={() => toggleSelection(item.id)}
            onImageClick={() => handleImageClick(item.id)}
          />
        ))}
      </div>

      <ImageLightbox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
        onIndexChange={setLightboxIndex}
      />

      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Items</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.size} selected item{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBulkDeleting ? 'Deleting...' : 'Delete All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
