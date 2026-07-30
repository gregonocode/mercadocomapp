import type { Metadata, Viewport } from 'next';
import { PwaInstallPrompt } from '@/app/components/pwa/PwaInstallPrompt';
import { SystemPwaRegistrar } from '@/app/components/system-pwa-registrar';
import { systemPwa } from '@/app/lib/pwa/manifests';

export const metadata: Metadata = {
  title: 'Entrar | Loja com app',
  description: systemPwa.description,
  manifest: '/manifest/lojacomapp.webmanifest',
  appleWebApp: {
    capable: true,
    title: systemPwa.shortName,
    statusBarStyle: 'black-translucent',
  },
  icons: {
    apple: systemPwa.icons.icon192,
  },
};

export const viewport: Viewport = {
  themeColor: systemPwa.themeColor,
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <SystemPwaRegistrar />
      <PwaInstallPrompt />
      {children}
    </>
  );
}
