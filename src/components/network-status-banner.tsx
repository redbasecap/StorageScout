'use client';

import { useNetworkStatus } from '@/hooks/use-network-status';
import { WifiOff, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

export function NetworkStatusBanner() {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Don't show anything if we're online and haven't just reconnected
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-4 py-3 text-sm font-medium text-center transition-all duration-300',
        isOnline
          ? 'bg-green-600 text-white'
          : 'bg-orange-600 text-white'
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span>Back online - syncing changes</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span>You&apos;re offline - changes will sync when reconnected</span>
          </>
        )}
      </div>
    </div>
  );
}
