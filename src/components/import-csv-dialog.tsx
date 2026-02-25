'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { parseCsvToItems, validateImport, type ImportedItem } from '@/lib/import';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

type ImportCsvDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type ImportState = 'idle' | 'preview' | 'importing' | 'done';

export default function ImportCsvDialog({ open, onOpenChange }: ImportCsvDialogProps) {
  const [state, setState] = useState<ImportState>('idle');
  const [items, setItems] = useState<ImportedItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = parseCsvToItems(text);
    setItems(result.items);
    setErrors(result.errors);
    setState('preview');
  };

  const handleImport = async () => {
    if (!firestore || !user || items.length === 0) return;

    setState('importing');
    try {
      // Use batched writes for efficiency (max 500 per batch)
      let imported = 0;
      const batchSize = 500;

      for (let i = 0; i < items.length; i += batchSize) {
        const batch = writeBatch(firestore);
        const chunk = items.slice(i, i + batchSize);

        for (const item of chunk) {
          const ref = doc(collection(firestore, 'items'));
          batch.set(ref, {
            ...item,
            userId: user.uid,
            createdAt: serverTimestamp(),
          });
        }

        await batch.commit();
        imported += chunk.length;
      }

      setImportedCount(imported);
      setState('done');
      toast({
        title: 'Import Complete',
        description: `Successfully imported ${imported} items.`,
      });
    } catch (error) {
      console.error('Import failed:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import. Some items may have been imported.',
        variant: 'destructive',
      });
      setState('preview');
    }
  };

  const handleClose = () => {
    setState('idle');
    setItems([]);
    setErrors([]);
    setImportedCount(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    onOpenChange(false);
  };

  const summary = items.length > 0 ? validateImport(items) : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Items from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file exported from StorageScout or with columns: Name, Description, Box ID, Location, Tags.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {state === 'idle' && (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">Click to select CSV file</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {state === 'preview' && summary && (
            <>
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertTitle>Preview</AlertTitle>
                <AlertDescription>
                  Ready to import {summary.totalItems} items into {summary.uniqueBoxes} boxes
                  {summary.uniqueLocations > 0 && ` across ${summary.uniqueLocations} locations`}.
                </AlertDescription>
              </Alert>

              {summary.uniqueTags.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Tags found:</p>
                  <div className="flex flex-wrap gap-1">
                    {summary.uniqueTags.slice(0, 15).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                    {summary.uniqueTags.length > 15 && (
                      <Badge variant="outline" className="text-xs">+{summary.uniqueTags.length - 15} more</Badge>
                    )}
                  </div>
                </div>
              )}

              {errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warnings ({errors.length})</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-4 mt-1 text-xs space-y-0.5">
                      {errors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {errors.length > 5 && <li>...and {errors.length - 5} more</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {state === 'importing' && (
            <div className="flex flex-col items-center py-8">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
              <p className="text-sm font-medium">Importing {items.length} items...</p>
            </div>
          )}

          {state === 'done' && (
            <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 dark:text-green-200">Import Complete</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Successfully imported {importedCount} items.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {state === 'preview' && (
            <>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleImport} disabled={items.length === 0}>
                Import {items.length} Items
              </Button>
            </>
          )}
          {state === 'done' && (
            <Button onClick={handleClose}>Done</Button>
          )}
          {state === 'idle' && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
