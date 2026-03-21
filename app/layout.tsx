import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/src/components/layout/AppShell';
import type { ChildrenNode } from '@/src/types/common';
import './globals.css';
import { APP_NAME, APP_DESCR } from '@/src/constants/app';

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_DESCR}`,
  applicationName: APP_NAME,
  icons: { icon: '/fish.svg' },
};

export const viewport: Viewport = {
  themeColor: '#52dad3',
};

export default function RootLayout({ children }: Readonly<ChildrenNode>) {
  return (
    <html lang="en" className="dark">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
