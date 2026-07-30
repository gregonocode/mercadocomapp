//app\components\pwa\StorePwaInstallPrompt.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownTrayIcon,
  ArrowUpOnSquareIcon,
  BellAlertIcon,
  ClipboardDocumentIcon,
  ShoppingBagIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

type StorePwaInstallPromptProps = {
  slug: string;
  appName: string;
  iconUrl?: string | null;
  themeColor?: string;
};

function isStandaloneMode() {
  if (typeof window === 'undefined') return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function getPlatform() {
  if (typeof window === 'undefined') {
    return {
      isIos: false,
      isSafari: false,
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1);
  const isSafari =
    /safari/.test(userAgent) &&
    !/chrome|crios|fxios|edgios|opr\//.test(userAgent);

  return {
    isIos,
    isSafari,
  };
}

export default function StorePwaInstallPrompt({
  slug,
  appName,
  iconUrl,
  themeColor = '#D90D13',
}: StorePwaInstallPromptProps) {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState(() => getPlatform());

  useEffect(() => {
    const media = window.matchMedia('(display-mode: standalone)');

    const frame = window.requestAnimationFrame(() => {
      setPlatform(getPlatform());
      setIsStandalone(isStandaloneMode());
    });

    function handleDisplayModeChange() {
      setIsStandalone(isStandaloneMode());
    }

    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    }

    function handleAppInstalled() {
      setIsStandalone(true);
      setDeferredPrompt(null);
    }

    media.addEventListener?.('change', handleDisplayModeChange);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.cancelAnimationFrame(frame);
      media.removeEventListener?.('change', handleDisplayModeChange);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt,
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    try {
      setIsInstalling(true);
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } finally {
      setIsInstalling(false);
    }
  }

  async function handleCopyLink() {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(window.location.href);
    } else {
      const input = document.createElement('textarea');
      input.value = window.location.href;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
    }

    setCopiedLink(true);
  }

  if (isStandalone || isDismissed) {
    return null;
  }

  const showNativeInstall = !platform.isIos && !!deferredPrompt;
  const showIosGuide = platform.isIos;

  if (!showNativeInstall && !showIosGuide) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-[34px] border border-zinc-200 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-16 w-16 flex-none items-center justify-center overflow-hidden rounded-[24px] text-white shadow-sm"
              style={{ backgroundColor: themeColor }}
            >
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconUrl}
                  alt={appName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ShoppingBagIcon className="h-8 w-8" />
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                Aplicativo
              </p>
              <h2 className="text-xl font-semibold tracking-tight text-[#181818]">
                Instale {appName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-zinc-400 transition hover:bg-[#F7F7F5] hover:text-[#181818]"
            aria-label="Fechar aviso de instalacao"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-5 text-sm font-medium leading-6 text-zinc-600">
           Mais conforto e rapidez, acompanhe o status da sua entrega e 
           acesse o app com apenas um clique, sem precisar procurar o link novamente.
        </p>

        {showNativeInstall && (
          <div className="mt-5 grid gap-3">
            <div className="flex items-start gap-3 rounded-[24px] bg-[#F7F7F5] p-4">
              <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-[18px] bg-white text-[#181818]">
                <ShoppingBagIcon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#181818]">
                  Pedido em poucos toques
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Abra o mercado, escolha seus produtos e finalize com mais
                  agilidade.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[24px] bg-[#F7F7F5] p-4">
              <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-[18px] bg-white text-[#181818]">
                <BellAlertIcon className="h-5 w-5" />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#181818]">
                  Notificações
                </p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">
                  Seja notificado quando seu pedido saiu pra entrega e muito mais!
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5">
          {showNativeInstall && (
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                {isInstalling ? 'Abrindo...' : 'Instalar app'}
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="flex h-11 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-[#181818] transition hover:bg-zinc-50"
              >
                Agora nao
              </button>
            </div>
          )}

          {showIosGuide && (
            <div className="mt-3 space-y-3">
              <div className="rounded-[26px] bg-[#F7F7F5] p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-[16px] bg-white text-[#181818]">
                    <ArrowUpOnSquareIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#181818]">
                      1. Toque em Compartilhar
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Use o botao de compartilhamento do Safari.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-[16px] bg-white text-[#181818]">
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-[#181818]">
                      2. Adicione a Tela de Inicio
                    </p>
                    <p className="mt-1 text-sm leading-6 text-zinc-500">
                      Depois confirme para instalar o app da {appName}.
                    </p>
                  </div>
                </div>
              </div>

              {!platform.isSafari && (
                <>
                  <p className="rounded-[18px] bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-700">
                    Para instalar, copie o link e abra no Safari.
                  </p>

                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#181818] px-5 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                    {copiedLink ? 'Link copiado' : 'Copiar link'}
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="flex h-11 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-[#181818] transition hover:bg-zinc-50"
              >
                Entendi
              </button>
            </div>
          )}
        </div>

        <span className="sr-only">PWA da loja {slug}</span>
      </div>
    </div>
  );
}
