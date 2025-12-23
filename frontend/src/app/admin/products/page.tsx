import Link from 'next/link';
import { type ProductData } from '@/types/product';
import Pagination from '@/components/Pagination'; // Pagination component
import DeleteLink from '@/app/admin/products/DeleteLink';

// Product data type definition
type Product = Pick<ProductData, 'id' | 'name' | 'price' | 'stock' | 'updated_at'>;

// Data required for products page
interface ProductsPageData {
  products: Product[]; // Product data array
  // Pagination information
  pagination: {
    currentPage: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
  };
}

// Admin product list page
export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // searchParams obtained asynchronously, so await is required
  const sp = await searchParams;

  // Get required data from URL query parameters
  const page = Number(sp?.page ?? '1');
  const perPage = Number(sp?.perPage ?? '20');

  // Get product data from products API
  const res = await fetch(`${process.env.API_BASE_URL}/api/products?page=${page}&perPage=${perPage}`, {
    cache: 'no-store'
  });

  // Get data returned from API
  const { products, pagination }: ProductsPageData = await res.json()
  if (!Array.isArray(products)) {
    console.error('Failed to load product data.');
    return <p className="text-center text-gray-500 text-lg py-10">Failed to load product data.</p>;
  }

  // Common table styles
  const tableStyle = 'px-5 py-3 border-b border-gray-300';

  // Set message based on query parameters
  const message =
    sp?.registered ? 'Product has been registered.' :
      sp?.edited ? 'Product has been updated.' :
        sp?.deleted ? 'Product has been deleted.' :
          null;

  return (
    <>
      {message && (
        <div className="w-full bg-green-100 text-green-800 p-3 text-center shadow-md flex items-center justify-center">
          {message}
        </div>
      )}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-center">Product List</h1>
        <div className="flex justify-end mb-4">
          <Link href="/admin/inquiries" className="bg-gray-400 hover:bg-gray-500 text-white py-2 px-4 rounded-sm font-semibold mr-2">
            Inquiries
          </Link>
          <Link href="/admin/products/register" className="bg-indigo-500 hover:bg-indigo-600 text-white py-2 px-4 rounded-sm font-semibold">
            Register Product
          </Link>
        </div>

        <div className="shadow-lg rounded-lg overflow-hidden">
          <table className="min-w-full leading-normal">
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left">
                <th className={tableStyle}>ID</th>
                <th className={tableStyle}>Product Name</th>
                <th className={tableStyle}>Price (incl. tax)</th>
                <th className={tableStyle}>Stock</th>
                <th className={tableStyle}>Last Updated</th>
                <th className={tableStyle}></th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`${tableStyle} text-center text-gray-500`}>
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-100">
                    <td className={tableStyle}>{product.id}</td>
                    <td className={tableStyle}>{product.name}</td>
                    <td className={tableStyle}>${product.price.toLocaleString()}</td>
                    <td className={tableStyle}>{product.stock}</td>
                    <td className={tableStyle}>
                      {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : '-'}
                    </td>
                    <td className={tableStyle}>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-indigo-600 hover:text-indigo-700 mr-6"
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
          {pagination.totalPages > 0 &&
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
            />}
        </section>
      </div>
    </>
  );
}