'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { Item } from '@/lib/types';
import { MapPin, Box, Trash2, Loader2, Pencil, ArrowRightLeft, Check } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import EditItemDialog from './edit-item-dialog';
import MoveItemDialog from './move-item-dialog';
import { cn } from '@/lib/utils';

type ItemCardProps = {
  item: Item;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onImageClick?: () => void;
};

export default function ItemCard({ item, selectionMode, selected, onSelect, onImageClick }: ItemCardProps) {
  const placeholderImage = PlaceHolderImages[0];
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);

  const handleDelete = async () => {
    if (!firestore || !firebaseApp) return;

    setIsDeleting(true);
    try {
      if (item.imageUrl && item.imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const storage = getStorage(firebaseApp);
          const imageRef = ref(storage, item.imageUrl);
          await deleteObject(imageRef);
        } catch {
          // Image might already be deleted
        }
      }
      await deleteDoc(doc(firestore, 'items', item.id));
      toast({
        title: 'Item Deleted',
        description: `"${item.name}" has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: 'Delete Failed',
        description: 'Could not delete the item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCardClick = () => {
    if (selectionMode && onSelect) {
      onSelect();
    }
  };

  return (
    <>
      <Card
        className={cn(
          'overflow-hidden transition-all hover:shadow-lg group relative',
          selectionMode && 'cursor-pointer',
          selected && 'ring-2 ring-primary'
        )}
        onClick={handleCardClick}
      >
        {/* Selection indicator */}
        {selectionMode && (
          <div
            className={cn(
              'absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
              selected
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-background/80 border-muted-foreground/50'
            )}
          >
            {selected && <Check className="h-4 w-4" />}
          </div>
        )}

        <CardHeader className="p-0">
          <div
            className="aspect-video relative cursor-zoom-in"
            onClick={(e) => {
              if (selectionMode) return;
              e.stopPropagation();
              if (item.imageUrl && onImageClick) onImageClick();
            }}
          >
            <Image
              src={item.imageUrl || placeholderImage.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint={placeholderImage.imageHint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <CardTitle className="text-lg font-semibold leading-tight truncate">{item.name}</CardTitle>
              {item.description && (
                <CardDescription className="mt-1 text-sm truncate">{item.description}</CardDescription>
              )}
            </div>
            {!selectionMode && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
                  onClick={(e) => { e.stopPropagation(); setIsEditOpen(true); }}
                  title="Edit item"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
                  onClick={(e) => { e.stopPropagation(); setIsMoveOpen(true); }}
                  title="Move to another box"
                >
                  <ArrowRightLeft className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                      disabled={isDeleting}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Item</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{item.name}&quot;? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
              <MapPin className="mr-2 h-4 w-4" />
              <span>{item.location}</span>
            </div>
            <div className="flex items-center">
              <Box className="mr-2 h-4 w-4" />
              <span className="truncate" title={item.boxId}>Box: {item.boxId.substring(0, 8)}...</span>
            </div>
          </div>
        </CardContent>
      </Card>
      <EditItemDialog item={item} open={isEditOpen} onOpenChange={setIsEditOpen} />
      <MoveItemDialog item={item} open={isMoveOpen} onOpenChange={setIsMoveOpen} />
    </>
  );
}
