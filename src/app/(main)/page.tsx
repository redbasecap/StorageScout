'use client'

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { QrCode, Inbox } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import jsQR from "jsqr";

export default function MainPage() {
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [boxId, setBoxId] = useState('');
  const router = useRouter();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>();

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
                // This can happen if the video is from a different origin.
                // With getUserMedia it should not happen, but as a safeguard we'll just keep trying.
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
