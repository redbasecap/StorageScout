'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { QrCode, Search, Inbox } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function MainPage() {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [boxId, setBoxId] = useState('');
  const router = useRouter();

  const handleScan = () => {
    if (boxId) {
      router.push(`/box/${boxId}`);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="text-center py-16">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-secondary mb-6">
            <Inbox className="h-12 w-12 text-secondary-foreground" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Your inventory is empty.
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Start organizing by scanning your first RAKO box.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button size="lg" onClick={() => setIsScanModalOpen(true)}>
            <QrCode className="mr-2 h-5 w-5" />
            Scan a Box
          </Button>
        </div>
      </div>
      
      <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Scan RAKO Box</DialogTitle>
            <DialogDescription>
              Enter the UUID from the QR code on your box. In a real app, this would use your camera.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
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
            <Button onClick={handleScan} disabled={!boxId}>Go to Box</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
