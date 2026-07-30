'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import {
  ArrowDownTrayIcon,
  ArrowUpOnSquareIcon,
  BellAlertIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { systemPwa } from '@/app/lib/pwa/manifests';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
};

const DISMISSED_STORAGE_KEY = 'lojacomapp-pwa-install-dismissed';

function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

function getPlatform() {
  if (typeof window === 'undefined') {
    return {
      isAndroid: false,
      isIos: false,
      isMobile: false,
      isSafari: false,
    };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIos =
    /iphone|ipad|ipod/.test(userAgent) ||
    (window.navigator.platform === 'MacIntel' &&
      window.navigator.maxTouchPoints > 1);
  const isAndroid = /android/.test(userAgent);
  const isSafari =
    /safari/.test(userAgent) &&
    !/chrome|crios|fxios|edgios|opr\//.test(userAgent);

  return {
    isAndroid,
    isIos,
    isMobile: isAndroid || isIos,
    isSafari,
  };
}

export function PwaInstallPrompt() {
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(true);
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
      setIsDismissed(
        window.sessionStorage.getItem(DISMISSED_STORAGE_KEY) === 'true',
      );
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

  function dismissPrompt() {
    window.sessionStorage.setItem(DISMISSED_STORAGE_KEY, 'true');
    setIsDismissed(true);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) {
      return;
    }

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

  if (isStandalone || isDismissed || !platform.isMobile) {
    return null;
  }

  const showAndroidInstall = platform.isAndroid && Boolean(deferredPrompt);
  const showIosGuide = platform.isIos;

  if (!showAndroidInstall && !showIosGuide) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
        <div className="bg-[radial-gradient(circle_at_50%_0%,rgba(192,132,252,0.95),rgba(126,34,206,0.75)_36%,rgba(24,24,27,1)_100%)] px-5 py-4 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 flex-none overflow-hidden rounded-2xl bg-white p-2 shadow-sm">
                <Image
                  src={systemPwa.icons.icon192}
                  alt={systemPwa.shortName}
                  fill
                  sizes="56px"
                  className="object-contain p-2"
                />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
                  App do lojista
                </p>
                <h2 className="text-lg font-semibold tracking-tight">
                  Instalar {systemPwa.shortName}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissPrompt}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar aviso de instalação"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {showAndroidInstall && (
            <>
              <div className="flex items-start gap-3 rounded-3xl bg-[#f7f7f5] p-4">
                <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white text-purple-700">
                  <BellAlertIcon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Acesse o painel como app
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Instale o {systemPwa.shortName} no celular para abrir seu
                    painel mais rápido e acompanhar sua loja com mais facilidade.
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {isInstalling ? 'Abrindo instalação...' : 'Instalar app'}
                </button>

                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50"
                >
                  Agora não
                </button>
              </div>
            </>
          )}

          {showIosGuide && (
            <>
              <div className="flex items-start gap-3 rounded-3xl bg-[#f7f7f5] p-4">
                <div className="mt-0.5 flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white text-purple-700">
                  <BellAlertIcon className="h-5 w-5" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-zinc-950">
                    Instale no iPhone
                  </p>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">
                    Adicione o {systemPwa.shortName} à tela inicial para abrir
                    o painel da sua loja mais rápido.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-[28px] bg-[#f7f7f5] p-4">
                <GuideStep
                  icon={ArrowUpOnSquareIcon}
                  title="1. Toque em Compartilhar"
                  description="Use o botão de compartilhamento do Safari."
                />

                <GuideStep
                  icon={ArrowDownTrayIcon}
                  title="2. Toque em Adicionar à Tela de Início"
                  description={`Depois confirme para instalar o ${systemPwa.shortName}.`}
                />
              </div>

              {!platform.isSafari && (
                <div className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-700">
                  Para instalar no iPhone, copie este link, abra o Safari e
                  cole na barra de endereço.
                </div>
              )}

              <div className="mt-5 grid gap-3">
                {!platform.isSafari && (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-purple-700 px-5 text-sm font-semibold text-white transition hover:bg-purple-800"
                  >
                    <ClipboardDocumentIcon className="h-5 w-5" />
                    {copiedLink ? 'Link copiado' : 'Copiar link'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="flex h-11 w-full items-center justify-center rounded-full border border-zinc-200 bg-white text-sm font-semibold text-zinc-950 transition hover:bg-zinc-50"
                >
                  Entendi
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GuideStep({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 [&+&]:mt-4">
      <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-2xl bg-white text-purple-700">
        <Icon className="h-5 w-5" />
      </div>

      <div>
        <p className="text-sm font-semibold text-zinc-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
      </div>
    </div>
  );
}
