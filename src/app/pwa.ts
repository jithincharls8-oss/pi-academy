import { isTauri } from '@/db/persistence';

/** Register the offline service worker in the browser build only. */
export function registerServiceWorker(): void {
  if (isTauri() || import.meta.env.DEV || !('serviceWorker' in navigator)) return;
  void import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
