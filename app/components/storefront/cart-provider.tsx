'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type CartProduct = {
  id: string;
  nome: string;
  preco: number;
  imagemUrl: string | null;
  quantidadeDisponivel: number;
};

export type CartItem = CartProduct & { quantidade: number };

type CartContextValue = {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (product: CartProduct) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function StoreCartProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const storageKey = `mercadocomapp:cart:${slug}`;
  const [items, setItems] = useState<CartItem[]>(() => getStoredCart(storageKey));

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  const value = useMemo<CartContextValue>(() => {
    function setQuantity(productId: string, quantity: number) {
      setItems((currentItems) =>
        currentItems.flatMap((item) => {
          if (item.id !== productId) return [item];

          const nextQuantity = Math.min(
            item.quantidadeDisponivel,
            Math.max(0, quantity),
          );

          return nextQuantity ? [{ ...item, quantidade: nextQuantity }] : [];
        }),
      );
    }

    return {
      items,
      totalItems: items.reduce((total, item) => total + item.quantidade, 0),
      subtotal: items.reduce(
        (total, item) => total + item.preco * item.quantidade,
        0,
      ),
      addItem(product) {
        setItems((currentItems) => {
          const existingItem = currentItems.find((item) => item.id === product.id);

          if (!existingItem) {
            return product.quantidadeDisponivel > 0
              ? [...currentItems, { ...product, quantidade: 1 }]
              : currentItems;
          }

          return currentItems.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  ...product,
                  quantidade: Math.min(
                    item.quantidade + 1,
                    product.quantidadeDisponivel,
                  ),
                }
              : item,
          );
        });
      },
      setQuantity,
      removeItem(productId) {
        setItems((currentItems) =>
          currentItems.filter((item) => item.id !== productId),
        );
      },
      clearCart() {
        setItems([]);
      },
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useStoreCart() {
  const context = useContext(CartContext);

  if (!context) throw new Error('useStoreCart deve ser usado dentro da loja.');

  return context;
}

function getStoredCart(storageKey: string): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const savedCart = window.localStorage.getItem(storageKey);
    return savedCart ? (JSON.parse(savedCart) as CartItem[]) : [];
  } catch {
    return [];
  }
}
