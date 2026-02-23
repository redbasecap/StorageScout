'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { generateBoxQrDataUrl } from '@/lib/qr-generate';
import { Download, Printer, Loader2 } from 'lucide-react';

type QrCodeDialogProps = {
  boxId: string;
  boxLabel?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function QrCodeDialog({ boxId, boxLabel, open, onOpenChange }: QrCodeDialogProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!open || !boxId) return;

    setIsLoading(true);
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    generateBoxQrDataUrl(boxId, { width: 400, baseUrl })
      .then(setQrDataUrl)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [open, boxId]);

  const handleDownload = useCallback(() => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `storagescout-qr-${boxId.substring(0, 8)}.png`;
    link.href = qrDataUrl;
    link.click();
  }, [qrDataUrl, boxId]);

  const handlePrint = useCallback(() => {
    if (!qrDataUrl) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const label = boxLabel || boxId.substring(0, 8);
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${label}</title>
          <style>
            body {
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            }
            img { max-width: 300px; }
            .label {
              margin-top: 16px;
              font-size: 18px;
              font-weight: 600;
            }
            .id {
              margin-top: 4px;
              font-size: 12px;
              color: #666;
              font-family: monospace;
            }
            @media print {
              body { min-height: auto; }
            }
          </style>
        </head>
        <body>
          <img src="${qrDataUrl}" alt="QR Code" />
          <div class="label">${label}</div>
          <div class="id">${boxId}</div>
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [qrDataUrl, boxId, boxLabel]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Box QR Code</DialogTitle>
          <DialogDescription>
            Print or download this QR code and attach it to your storage box.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          {isLoading ? (
            <div className="flex items-center justify-center w-64 h-64">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : qrDataUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrDataUrl}
                alt={`QR code for box ${boxId}`}
                className="w-64 h-64"
              />
              <p className="mt-3 text-sm font-medium">
                {boxLabel || 'Unnamed Box'}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate max-w-xs">
                {boxId}
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">Failed to generate QR code.</p>
          )}
        </div>

        <DialogFooter className="flex gap-2 sm:justify-center">
          <Button variant="outline" onClick={handleDownload} disabled={!qrDataUrl}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={handlePrint} disabled={!qrDataUrl}>
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
