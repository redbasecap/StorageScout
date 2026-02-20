'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import type { Item } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type MoveItemDialogProps = {
  item: Item;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function MoveItemDialog({ item, open, onOpenChange }: MoveItemDialogProps) {
  const [newBoxId, setNewBoxId] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleMove = async () => {
    if (!firestore || !newBoxId.trim()) return;

    const trimmedBoxId = newBoxId.trim();
    if (trimmedBoxId === item.boxId) {
      toast({
        title: 'Same Box',
        description: 'The item is already in this box.',
        variant: 'destructive',
      });
      return;
    }

    setIsMoving(true);
    try {
      await updateDoc(doc(firestore, 'items', item.id), {
        boxId: trimmedBoxId,
      });

      toast({
        title: 'Item Moved',
        description: `"${item.name}" has been moved to box ${trimmedBoxId.substring(0, 8)}...`,
      });
      setNewBoxId('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error moving item:', error);
      toast({
        title: 'Move Failed',
        description: 'Could not move the item. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Item</DialogTitle>
          <DialogDescription>
            Move &quot;{item.name}&quot; to a different box. Enter the target box UUID.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label>Current Box</Label>
            <p className="text-sm text-muted-foreground font-mono truncate">{item.boxId}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-box-id">New Box UUID</Label>
            <Input
              id="new-box-id"
              value={newBoxId}
              onChange={(e) => setNewBoxId(e.target.value)}
              placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isMoving || !newBoxId.trim()}>
            {isMoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Move Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
