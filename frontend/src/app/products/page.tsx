import React from 'react';
import ProductList from '@/components/ProductList';
import { type ProductCardProps } from '@/components/ProductCard';
import { ProductListItem } from '@/lib/types';
import Pagination from '@/components/Pagination';
import Sort from '@/app/products/Sort';

interface ProductsPageData {
  products: ProductListItem[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = Number(sp?.page ?? '1');
  const perPage = Number(sp?.perPage ?? '16');
  const sort = typeof sp?.sort === 'string' ? sp.sort : 'new';
  const keyword = typeof sp?.keyword === 'string' ? sp.keyword : '';

  const query = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
    sort,
    keyword
  });

  const res = await fetch(`${process.env.API_BASE_URL}/api/products?${query.toString()}`, {
    cache: 'no-store'
  });

  const productsPageData: ProductsPageData = await res.json();
  if (!Array.isArray(productsPageData.products)) {
    console.error('Failed to load product data.');
    return <p className="text-center text-stone-500 text-lg py-10">Failed to load product data.</p>;
  }

  const products: ProductCardProps[] = productsPageData.products.map((row) => ({
    id: String(row.id),
    title: row.name,
    price: row.price,
    rating: row.review_avg ?? 0,
    reviewCount: row.review_count ?? 0,
    imageUrl: row.image_url ?? undefined
  }));

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Products</h1>
      <section className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6">
        <p className="text-sm sm:text-base lg:text-lg">
          {keyword && (
            <>
              Search results for "<span className="text-blue-600 font-semibold">{keyword}</span>":&nbsp;
            </>
          )}
          {productsPageData.pagination.totalItems} products found (showing page&nbsp;
          {productsPageData.pagination.currentPage} of&nbsp;
          {productsPageData.pagination.totalPages})
        </p>
        <Sort sort={sort} perPage={perPage} keyword={keyword} />
      </section>

      <section className="mb-8">
        <ProductList products={products} />
      </section>

      <section className="mb-8">
        {productsPageData.pagination.totalPages > 0 &&
          <Pagination
            currentPage={productsPageData.pagination.currentPage}
            totalPages={productsPageData.pagination.totalPages}
          />}
      </section>
    </main>
  );
}