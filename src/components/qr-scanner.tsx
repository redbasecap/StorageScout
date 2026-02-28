'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { extractBoxId } from '@/lib/qr-utils';
import { CheckCircle2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

type ScanStatus = 'idle' | 'scanning' | 'success' | 'error';

type QrScannerProps = {
  active: boolean;
  onScan: (boxId: string) => void;
  /** Scan interval in ms (default: 80) */
  scanInterval?: number;
};

/**
 * Reusable QR code scanner component.
 * Handles camera permission, scanning via jsQR, and visual feedback.
 */
export default function QrScanner({ active, onScan, scanInterval = 80 }: QrScannerProps) {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanStatus>('idle');
  const [scanError, setScanError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const stopCameraStream = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    if (active) {
      setHasCameraPermission(null);
      setScanStatus('idle');
      setScanError('');

      const getCameraPermission = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 },
              // @ts-expect-error - focusMode supported in modern browsers but not in TS types
              focusMode: { ideal: 'continuous' },
            },
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
    };
  }, [active, stopCameraStream]);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | undefined;
    const SCAN_WIDTH = 640;

    const tick = async () => {
      if (
        videoRef.current &&
        videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
        canvasRef.current
      ) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          const scale = Math.min(1, SCAN_WIDTH / video.videoWidth);
          canvas.width = Math.round(video.videoWidth * scale);
          canvas.height = Math.round(video.videoHeight * scale);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          try {
            const { default: jsQR } = await import('jsqr');
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code) {
              const boxId = extractBoxId(code.data);
              if (boxId) {
                setScanStatus('success');
                stopCameraStream();
                if (intervalId) clearInterval(intervalId);
                onScan(boxId);
              } else {
                setScanStatus('error');
                setScanError('Invalid QR code format. Please scan a valid box QR code.');
                stopCameraStream();
                if (intervalId) clearInterval(intervalId);
                setTimeout(() => {
                  setScanStatus('scanning');
                  navigator.mediaDevices
                    .getUserMedia({
                      video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                      },
                    })
                    .then((stream) => {
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

    if (hasCameraPermission === true && active && scanStatus === 'scanning') {
      intervalId = setInterval(tick, scanInterval);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [hasCameraPermission, active, scanStatus, scanInterval, onScan, stopCameraStream]);

  return (
    <div
      className="relative w-full aspect-video rounded-md border bg-muted overflow-hidden flex items-center justify-center"
      role="region"
      aria-label="QR code scanner"
      aria-live="polite"
    >
      <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
      <canvas ref={canvasRef} className="hidden" />

      {/* Scanning overlay with corner guides */}
      {scanStatus === 'scanning' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-[280px] aspect-square">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 rounded-br-lg" />
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-cyan-400 animate-pulse" />
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
  );
}
