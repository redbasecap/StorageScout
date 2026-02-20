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
import { useToast } from '@/hooks/use-toast';

type RenameBoxDialogProps = {
  boxId: string;
  currentLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (boxId: string, name: string) => Promise<void>;
};

export default function RenameBoxDialog({
  boxId,
  currentLabel,
  open,
  onOpenChange,
  onSave,
}: RenameBoxDialogProps) {
  const [name, setName] = useState(currentLabel || '');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(boxId, name);
      toast({
        title: name.trim() ? 'Box Renamed' : 'Label Removed',
        description: name.trim()
          ? `Box is now labeled "${name.trim()}".`
          : 'Box label has been removed.',
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error renaming box:', error);
      toast({
        title: 'Rename Failed',
        description: 'Could not rename the box. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Box</DialogTitle>
          <DialogDescription>
            Give this box a friendly name. Leave empty to remove the label.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="box-name">Box Name</Label>
            <Input
              id="box-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Winter Clothes"
              autoFocus
            />
          </div>
          <p className="text-xs text-muted-foreground font-mono">{boxId}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
