'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { QrCode, Inbox } from "lucide-react";
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

export default function MainPage() {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [boxId, setBoxId] = useState('');
  const router = useRouter();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

  const { user } = useUser();
  const firestore = useFirestore();

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
    if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (isScanModalOpen) {
      setHasCameraPermission(null);
      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          setHasCameraPermission(true);

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error('Error accessing camera:', error);
          setHasCameraPermission(false);
        }
      };

      getCameraPermission();
    } else {
        stopCameraStream();
    }

    return () => {
        stopCameraStream();
    }
  }, [isScanModalOpen, stopCameraStream]);

  useEffect(() => {
    const tick = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            canvas.height = video.videoHeight;
            canvas.width = video.videoWidth;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height, {
                    inversionAttempts: "dontInvert",
                });

                if (code) {
                    stopCameraStream();
                    router.push(`/box/${code.data}`);
                } else {
                    animationFrameId.current = requestAnimationFrame(tick);
                }
            } catch (e) {
                animationFrameId.current = requestAnimationFrame(tick);
            }
        } else {
            animationFrameId.current = requestAnimationFrame(tick);
        }
      } else {
        animationFrameId.current = requestAnimationFrame(tick);
      }
    };

    if (hasCameraPermission === true && isScanModalOpen) {
        animationFrameId.current = requestAnimationFrame(tick);
    }
    
    return () => {
        if(animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
    }

  }, [hasCameraPermission, isScanModalOpen, router, stopCameraStream]);


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
              Start organizing by scanning your first RAKO box.
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
            <DialogTitle>Scan RAKO Box</DialogTitle>
            <DialogDescription>
              Point your camera at a box's QR code or enter the UUID manually.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="relative w-full aspect-video rounded-md border bg-muted overflow-hidden flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                <canvas ref={canvasRef} className="hidden" />
                {hasCameraPermission === false && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 bg-black/50">
                        <Alert variant="destructive">
                            <AlertTitle>Camera Access Required</AlertTitle>
                            <AlertDescription>
                                Please allow camera access in your browser to use this feature.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
                 {hasCameraPermission === null && (
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
