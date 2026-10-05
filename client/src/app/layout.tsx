import type { Metadata, Viewport } from 'next';
import './globals.css';
import { constructMetadata, generateOrganizationSchema } from '@/lib/seo';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import { ToastProvider } from '@/components/ui/Toast';
import ClientShell from '@/layouts/ClientShell';

export const metadata: Metadata = constructMetadata();

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateOrganizationSchema();

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <ToastProvider>
          <ClientShell>
            {children}
          </ClientShell>
          <ServiceWorkerRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
