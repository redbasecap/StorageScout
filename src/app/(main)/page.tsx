'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { extractBoxId } from '@/lib/qr-utils';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { QrCode, Inbox, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import jsQR from "jsqr";
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Item, Box } from '@/lib/types';
import { collection, query, where, orderBy } from 'firebase/firestore';
import BoxList from '@/components/box-list';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

export default function MainPage() {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [boxId, setBoxId] = useState('');
  const router = useRouter();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // animationFrameId no longer needed — using setInterval for consistent scan rate

  const { user } = useUser();
  const firestore = useFirestore();

  // extractBoxId is now imported from @/lib/qr-utils

  const itemsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
        collection(firestore, 'items'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: items, isLoading: isLoadingItems } = useCollection<Item>(itemsQuery);

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

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isScanModalOpen) {
      setHasCameraPermission(null);
      setScanStatus('idle');
      setScanError('');
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
              // @ts-expect-error - focusMode is supported in modern browsers but not in TS types
              focusMode: { ideal: "continuous" },
            } 
          });
          setHasCameraPermission(true);
          setScanStatus('scanning');

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
          setScanStatus('error');
          setScanError('Camera access denied. Please enable camera permissions.');
        }
      };

      getCameraPermission();
    } else {
        stopCameraStream();
        setScanStatus('idle');
        setScanError('');
    }

    return () => {
        stopCameraStream();
    }
  }, [isScanModalOpen, stopCameraStream]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    // Downscale target for faster jsQR processing
    const SCAN_WIDTH = 640;

    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
            // Downscale for faster processing — QR codes don't need full resolution
            const scale = Math.min(1, SCAN_WIDTH / video.videoWidth);
            canvas.width = Math.round(video.videoWidth * scale);
            canvas.height = Math.round(video.videoHeight * scale);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    const boxId = extractBoxId(code.data);
                    if (boxId) {
                        setScanStatus('success');
                        stopCameraStream();
                        if (intervalId) clearInterval(intervalId);
                        // Brief delay to show success animation
                        setTimeout(() => {
                            router.push(`/box/${boxId}`);
                        }, 500);
                    } else {
                        setScanStatus('error');
                        setScanError('Invalid QR code format. Please scan a valid box QR code.');
                        stopCameraStream();
                        if (intervalId) clearInterval(intervalId);
                        // Reset after showing error
                        setTimeout(() => {
                            setScanStatus('scanning');
                            navigator.mediaDevices.getUserMedia({ 
                              video: { 
                                facingMode: "environment",
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                              } 
                            }).then(stream => {
                                if (videoRef.current) {
                                    videoRef.current.srcObject = stream;
                                }
                            });
                        }, 2000);
                    }
                }
            } catch {
                // jsQR processing error — continue scanning
            }
        }
      }
    };

    if (hasCameraPermission === true && isScanModalOpen && scanStatus === 'scanning') {
        // Scan every 80ms (~12fps) — fast enough for responsive scanning, light on CPU
        intervalId = setInterval(tick, 80);
    }

    return () => {
        if (intervalId) clearInterval(intervalId);
    }

  }, [hasCameraPermission, isScanModalOpen, scanStatus, router, stopCameraStream]);


  const handleGoToBox = () => {
    if (boxId) {
      router.push(`/box/${boxId}`);
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
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold tracking-tight">Your Boxes</h1>
                    <Button onClick={() => setIsScanModalOpen(true)}>
                        <QrCode className="mr-2 h-5 w-5" />
                        Scan a Box
                    </Button>
                </div>
                <BoxList boxes={boxes} />
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
              Point your camera at a box's QR code or enter the UUID manually.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative w-full aspect-video rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />

                {/* Scanning overlay with corner guides */}
                {scanStatus === 'scanning' && (
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Semi-transparent overlay */}
                        <div className="absolute inset-0 bg-black/30" />

                        {/* Scanning frame with corner guides */}
                        <div className="absolute inset-0 flex items-center justify-center p-8">
                            <div className="relative w-full max-w-[280px] aspect-square">
                                {/* Corner guides */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />

                                {/* Scanning line animation */}
                                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-cyan-400 animate-pulse" />

                                {/* Instruction text */}
                                <div className="absolute -bottom-12 left-0 right-0 text-center">
                                    <p className="text-white text-sm font-medium drop-shadow-lg">
                                        Searching for QR code...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Success state */}
                {scanStatus === 'success' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-600/90 backdrop-blur-sm">
                        <CheckCircle2 className="h-16 w-16 text-white mb-4 animate-pulse" />
                        <p className="text-white text-lg font-semibold">QR Code Detected!</p>
                        <p className="text-white/80 text-sm">Navigating to box...</p>
                    </div>
                )}

                {/* Error state */}
                {scanStatus === 'error' && scanError && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <Alert variant="destructive" className="max-w-sm">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{scanError}</AlertDescription>
                        </Alert>
                    </div>
                )}

                {/* Camera permission request */}
                {hasCameraPermission === null && scanStatus === 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <p className="text-muted-foreground">Requesting camera...</p>
                    </div>
                )}
            </div>
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
    </div>
  );
}
