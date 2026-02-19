'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { Item } from '@/lib/types';
import { MapPin, Box, Trash2, Loader2, Pencil } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useFirestore, useFirebaseApp } from '@/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import EditItemDialog from './edit-item-dialog';

type ItemCardProps = {
  item: Item;
};

export default function ItemCard({ item }: ItemCardProps) {
  const placeholderImage = PlaceHolderImages[0];
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleDelete = async () => {
    if (!firestore || !firebaseApp) return;

    setIsDeleting(true);
    try {
      // Delete image from Storage if it exists
      if (item.imageUrl && item.imageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const storage = getStorage(firebaseApp);
          const imageRef = ref(storage, item.imageUrl);
          await deleteObject(imageRef);
        } catch {
          // Image might already be deleted, continue with doc deletion
        }
      }

      // Delete Firestore document
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

  return (
    <>
    <Card className="overflow-hidden transition-all hover:shadow-lg group relative">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
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
          <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary shrink-0"
                onClick={() => setIsEditOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                disabled={isDeleting}
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
        </div>
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
    </>
  );
}
