import React from 'react';
import { RefreshCw, WifiOff } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  queuedCount: number;
  isSyncing: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isOnline,
  queuedCount,
  isSyncing,
}) => {
  if (isOnline && queuedCount === 0 && !isSyncing) {
    return null;
  }

  if (!isOnline) {
    return (
      <div
        role="status"
        className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-800 dark:text-amber-200"
      >
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-2 sm:px-2 lg:px-4">
          <div className="flex items-center gap-2 font-medium">
            <WifiOff className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>
              Offline mode active — All edits, token counts, and probability simulations save locally.
            </span>
          </div>
          {queuedCount > 0 && (
            <span className="font-mono tabular-nums text-amber-700 dark:text-amber-300">
              {queuedCount} queued {queuedCount === 1 ? 'run' : 'runs'} pending reconnect
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="border-b border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs text-sky-800 dark:text-sky-200"
    >
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 sm:px-2 lg:px-4">
        <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-500" aria-hidden="true" />
        <span>
          Connection restored — Syncing {queuedCount} queued offline {queuedCount === 1 ? 'prompt' : 'prompts'}...
        </span>
      </div>
    </div>
  );
};
