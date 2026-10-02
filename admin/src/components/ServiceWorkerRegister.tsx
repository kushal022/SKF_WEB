import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            registration.onupdatefound = () => {
              const installingWorker = registration.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('Admin app update ready.');
                  }
                };
              }
            };
          })
          .catch((error) => {
            console.error('Admin service worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}

export default ServiceWorkerRegister;
