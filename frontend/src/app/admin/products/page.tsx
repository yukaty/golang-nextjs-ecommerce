import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductAdminItem } from '@/lib/types';
import { TABLE_CELL_STYLE, SUCCESS_MESSAGE_STYLE } from '@/lib/constants';
import Pagination from '@/components/Pagination';
import DeleteLink from '@/app/admin/products/DeleteLink';

interface ProductsPageData {
  products: ProductAdminItem[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const page = Number(sp?.page ?? '1');
  const perPage = Number(sp?.perPage ?? '20');

  const res = await fetch(`${process.env.API_BASE_URL}/api/products?page=${page}&perPage=${perPage}`, {
    cache: 'no-store'
  });

  const { products, pagination }: ProductsPageData = await res.json();
  if (!Array.isArray(products)) {
    console.error('Failed to load product data.');
    return <p className="text-center text-stone-500 text-lg py-10">Failed to load product data.</p>;
  }

  const message =
    sp?.registered ? 'Product has been registered.' :
      sp?.edited ? 'Product has been updated.' :
        sp?.deleted ? 'Product has been deleted.' :
          null;

  return (
    <>
      {message && (
        <div className={SUCCESS_MESSAGE_STYLE}>
          {message}
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-center">Product List</h1>
        <div className="flex justify-end mb-4">
          <Link href="/admin/inquiries" className="bg-stone-400 hover:bg-stone-500 text-white py-2 px-4 rounded-sm font-semibold mr-2">
            Inquiries
          </Link>
          <Link href="/admin/products/register" className="bg-forest-500 hover:bg-forest-600 text-white py-2 px-4 rounded-sm font-semibold">
            Register Product
          </Link>
        </div>

        <div className="shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-stone-200 text-stone-700 text-left">
                <th className={TABLE_CELL_STYLE}>ID</th>
                <th className={TABLE_CELL_STYLE}>Product Name</th>
                <th className={TABLE_CELL_STYLE}>Price (incl. tax)</th>
                <th className={TABLE_CELL_STYLE}>Stock</th>
                <th className={TABLE_CELL_STYLE}>Last Updated</th>
                <th className={TABLE_CELL_STYLE}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className={cn(TABLE_CELL_STYLE, 'text-center text-stone-500')}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-100">
                    <td className={TABLE_CELL_STYLE}>{product.id}</td>
                    <td className={TABLE_CELL_STYLE}>{product.name}</td>
                    <td className={TABLE_CELL_STYLE}>${product.price.toLocaleString()}</td>
                    <td className={TABLE_CELL_STYLE}>{product.stock}</td>
                    <td className={TABLE_CELL_STYLE}>
                      {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                    </td>
                    <td className={TABLE_CELL_STYLE}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-forest-600 hover:text-forest-700 mr-6"
                      >
                        Edit
                      </Link>
                      <DeleteLink id={product.id} name={product.name} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <section className="mb-8">
          {pagination.totalPages > 0 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
            />
          )}
        </section>
      </div>
    </>
  );
}