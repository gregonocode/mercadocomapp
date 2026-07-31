'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ChartBarIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  HomeIcon,
  PaintBrushIcon,
  ShoppingBagIcon,
  Squares2X2Icon,
  TagIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  {
    name: 'Início',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Análises',
    href: '/dashboard/relatorios',
    icon: ChartBarIcon,
  },
  {
    name: 'Produtos',
    href: '/dashboard/produtos',
    icon: ShoppingBagIcon,
  },
  {
    name: 'Categorias',
    href: '/dashboard/categorias',
    icon: TagIcon,
  },
  {
    name: 'Pedidos',
    href: '/dashboard/pedidos',
    icon: Squares2X2Icon,
  },
  {
    name: 'Entrega',
    href: '/dashboard/entrega',
    icon: TruckIcon,
  },
  {
    name: 'Identidade visual',
    href: '/dashboard/configuracoes/identidade-visual',
    icon: PaintBrushIcon,
  },
  
  {
    name: 'Configurações',
    href: '/dashboard/configuracoes',
    icon: Cog6ToothIcon,
  },
];

const productNavigation = [
  {
    name: 'Cadastrar produto',
    href: '/dashboard/produtos/novo',
  },
  {
    name: 'Lista de produtos',
    href: '/dashboard/produtos',
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/dashboard/configuracoes') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNavigation() {
  const pathname = usePathname();
  const [productsOpen, setProductsOpen] = useState(
    pathname.startsWith('/dashboard/produtos'),
  );

  return (
    <nav className="mt-3 flex-1 space-y-1">
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href);

        if (item.name === 'Produtos') {
          return (
            <div key={item.name}>
              <button
                type="button"
                aria-expanded={productsOpen}
                aria-controls="products-navigation"
                onClick={() => setProductsOpen((open) => !open)}
                className={[
                  'group flex h-10 w-full items-center justify-between rounded-lg px-3 text-sm transition',
                  active
                    ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex items-center gap-3',
                    active ? 'font-bold' : 'font-medium',
                  ].join(' ')}
                >
                  <item.icon
                    className={[
                      'h-5 w-5 shrink-0',
                      active
                        ? 'text-zinc-950'
                        : 'text-zinc-500 group-hover:text-zinc-300',
                    ].join(' ')}
                  />
                  {item.name}
                </span>

                <ChevronDownIcon
                  className={[
                    'h-4 w-4 transition-transform',
                    productsOpen ? 'rotate-180' : '',
                    active ? 'text-zinc-500' : 'text-zinc-600',
                  ].join(' ')}
                />
              </button>

              {productsOpen && (
                <div
                  id="products-navigation"
                  className="mt-1 space-y-1 pl-11"
                >
                  {productNavigation.map((productItem) => {
                    const productActive =
                      pathname === productItem.href ||
                      (productItem.href !== '/dashboard/produtos' &&
                        pathname.startsWith(`${productItem.href}/`));

                    return (
                      <Link
                        key={productItem.name}
                        href={productItem.href}
                        className={[
                          'block rounded-lg px-3 py-2 text-xs transition',
                          productActive
                            ? 'bg-zinc-900 font-bold text-white'
                            : 'font-medium text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200',
                        ].join(' ')}
                      >
                        {productItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={[
              'group flex h-10 items-center justify-between rounded-lg px-3 text-sm transition',
              active
                ? 'bg-white text-zinc-950 shadow-sm ring-1 ring-zinc-200'
                : 'text-zinc-400 hover:bg-zinc-900 hover:text-white',
            ].join(' ')}
          >
            <span
              className={[
                'flex items-center gap-3',
                active ? 'font-bold' : 'font-medium',
              ].join(' ')}
            >
              <item.icon
                className={[
                  'h-5 w-5 shrink-0',
                  active
                    ? 'text-zinc-950'
                    : 'text-zinc-500 group-hover:text-zinc-300',
                ].join(' ')}
              />
              {item.name}
            </span>

            {['Produtos', 'Pedidos', 'Configurações'].includes(item.name) && (
              <ChevronDownIcon
                className={[
                  'h-4 w-4',
                  active ? 'text-zinc-500' : 'text-zinc-600',
                ].join(' ')}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNavigation() {
  const pathname = usePathname();
  const [productsOpen, setProductsOpen] = useState(
    pathname.startsWith('/dashboard/produtos'),
  );

  return (
    <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
      {navigation.map((item) => {
        const active = isActivePath(pathname, item.href);

        if (item.name === 'Produtos') {
          return (
            <div key={item.name} className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-expanded={productsOpen}
                aria-controls="mobile-products-navigation"
                onClick={() => setProductsOpen((open) => !open)}
                className={[
                  'flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs transition',
                  active
                    ? 'border-zinc-950 bg-zinc-950 font-bold text-white'
                    : 'border-zinc-200 bg-white font-medium text-zinc-600',
                ].join(' ')}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
                <ChevronDownIcon
                  className={[
                    'h-3.5 w-3.5 transition-transform',
                    productsOpen ? 'rotate-180' : '',
                  ].join(' ')}
                />
              </button>

              {productsOpen && (
                <div
                  id="mobile-products-navigation"
                  className="flex shrink-0 gap-2"
                >
                  {productNavigation.map((productItem) => {
                    const productActive =
                      pathname === productItem.href ||
                      (productItem.href !== '/dashboard/produtos' &&
                        pathname.startsWith(`${productItem.href}/`));

                    return (
                      <Link
                        key={productItem.name}
                        href={productItem.href}
                        className={[
                          'flex h-10 shrink-0 items-center rounded-lg border px-3 text-xs transition',
                          productActive
                            ? 'border-zinc-950 bg-zinc-950 font-bold text-white'
                            : 'border-zinc-200 bg-white font-medium text-zinc-600',
                        ].join(' ')}
                      >
                        {productItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.name}
            href={item.href}
            className={[
              'flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs transition',
              active
                ? 'border-zinc-950 bg-zinc-950 font-bold text-white'
                : 'border-zinc-200 bg-white font-medium text-zinc-600',
            ].join(' ')}
          >
            <item.icon className="h-4 w-4" />
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}
