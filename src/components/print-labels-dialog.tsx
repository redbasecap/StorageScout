'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Loader2 } from 'lucide-react';
import { generateQrSheet } from '@/lib/qr-generate';

type PrintLabelsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boxes: Array<{ id: string; label?: string }>;
};

type LabelSize = 'small' | 'medium' | 'large';

const LABEL_CONFIGS: Record<LabelSize, { width: number; cols: number; qrSize: number; fontSize: string }> = {
  small: { width: 128, cols: 4, qrSize: 80, fontSize: '8px' },
  medium: { width: 200, cols: 3, qrSize: 120, fontSize: '10px' },
  large: { width: 256, cols: 2, qrSize: 160, fontSize: '12px' },
};

export default function PrintLabelsDialog({ open, onOpenChange, boxes }: PrintLabelsDialogProps) {
  const [labelSize, setLabelSize] = useState<LabelSize>('medium');
  const [labels, setLabels] = useState<Array<{ boxId: string; label: string; dataUrl: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (open && boxes.length > 0) {
      setIsGenerating(true);
      const config = LABEL_CONFIGS[labelSize];
      generateQrSheet(
        boxes.map((b) => ({ id: b.id, label: b.label })),
        { width: config.width }
      ).then((result) => {
        setLabels(result);
        setIsGenerating(false);
      });
    }
  }, [open, boxes, labelSize]);

  const handlePrint = () => {
    const config = LABEL_CONFIGS[labelSize];
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelsHtml = labels
      .map(
        (l) => `
      <div style="display:inline-block;text-align:center;padding:8px;border:1px dashed #ccc;margin:4px;width:${config.qrSize + 40}px;">
        <img src="${l.dataUrl}" width="${config.qrSize}" height="${config.qrSize}" />
        <div style="font-size:${config.fontSize};font-family:monospace;margin-top:4px;word-break:break-all;">${l.label}</div>
      </div>`
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>StorageScout Labels</title></head>
      <body style="margin:0;padding:16px;font-family:sans-serif;">
        <div style="display:flex;flex-wrap:wrap;justify-content:flex-start;">
          ${labelsHtml}
        </div>
        <script>window.onload=function(){window.print();}</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Print QR Labels</DialogTitle>
          <DialogDescription>
            Generate a printable sheet of QR code labels for {boxes.length} box{boxes.length !== 1 ? 'es' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="flex items-center gap-4">
            <Label>Label Size</Label>
            <Select value={labelSize} onValueChange={(v) => setLabelSize(v as LabelSize)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (4 per row)</SelectItem>
                <SelectItem value="medium">Medium (3 per row)</SelectItem>
                <SelectItem value="large">Large (2 per row)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="border rounded-lg p-4 max-h-[400px] overflow-auto bg-white dark:bg-zinc-950">
              <div className="flex flex-wrap gap-2 justify-center">
                {labels.slice(0, 12).map((l) => (
                  <div
                    key={l.boxId}
                    className="text-center p-2 border border-dashed rounded"
                    style={{ width: LABEL_CONFIGS[labelSize].qrSize + 40 }}
                  >
                    <img
                      src={l.dataUrl}
                      alt={l.label}
                      width={LABEL_CONFIGS[labelSize].qrSize}
                      height={LABEL_CONFIGS[labelSize].qrSize}
                      className="mx-auto"
                    />
                    <p className="text-xs font-mono mt-1 truncate">{l.label}</p>
                  </div>
                ))}
                {labels.length > 12 && (
                  <div className="flex items-center justify-center p-4 text-sm text-muted-foreground">
                    +{labels.length - 12} more labels
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handlePrint} disabled={isGenerating || labels.length === 0}>
            <Printer className="mr-2 h-4 w-4" />
            Print Labels
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
