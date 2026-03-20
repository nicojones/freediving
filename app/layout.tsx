import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/src/components/layout/AppShell';
import type { ChildrenNode } from '@/src/types/common';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fishly — Breathhold Protocol',
  applicationName: 'Fishly',
  icons: { icon: '/fish.svg' },
};

export const viewport: Viewport = {
  themeColor: '#52dad3',
};

export default function RootLayout({ children }: Readonly<ChildrenNode>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
