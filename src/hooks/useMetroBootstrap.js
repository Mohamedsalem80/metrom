import { useEffect } from 'react';

export function useMetroBootstrap() {
  useEffect(() => {
    let cancelled = false;

    const initialize = async () => {
      if (!cancelled && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // Service worker registration can fail in private sessions or unsupported contexts.
        });
      }
    };

    initialize();

    return () => {
      cancelled = true;
    };
  }, []);
}
