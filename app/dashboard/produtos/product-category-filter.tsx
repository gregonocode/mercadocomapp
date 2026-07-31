'use client';

import { useRouter } from 'next/navigation';

type Category = {
  id: string;
  nome: string;
};

type ProductCategoryFilterProps = {
  categories: Category[];
  selectedCategory: string;
};

export function ProductCategoryFilter({
  categories,
  selectedCategory,
}: ProductCategoryFilterProps) {
  const router = useRouter();

  function handleCategoryChange(categoryId: string) {
    const params = new URLSearchParams();

    if (categoryId) {
      params.set('categoria', categoryId);
    }

    const query = params.toString();
    router.push(`/dashboard/produtos${query ? `?${query}` : ''}`);
  }

  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-xs font-semibold text-zinc-500">Categoria</span>
      <select
        value={selectedCategory}
        onChange={(event) => handleCategoryChange(event.target.value)}
        className="h-11 min-w-52 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 outline-none transition focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5"
      >
        <option value="">Todas as categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.nome}
          </option>
        ))}
      </select>
    </label>
  );
}
