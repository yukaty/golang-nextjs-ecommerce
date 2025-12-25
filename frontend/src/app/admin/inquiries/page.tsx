import Link from 'next/link';
import { cookies } from 'next/headers';
import { cn } from '@/lib/utils';
import { AUTH_TOKEN } from '@/lib/auth';
import { TABLE_CELL_STYLE } from '@/lib/constants';

type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export default async function InquiriesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN)?.value;

  const headers: HeadersInit = {};
  if (token) {
    headers['Cookie'] = `${AUTH_TOKEN}=${token}`;
  }

  const res = await fetch(`${process.env.API_BASE_URL}/api/inquiries`, {
    cache: 'no-store',
    headers: headers
  });

  const inquiries: Inquiry[] = await res.json();
  if (!Array.isArray(inquiries)) {
    console.error('Failed to load inquiry data.');
    return <p className="text-center text-stone-500 text-lg py-10">Failed to load inquiry data.</p>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="my-4">
        <Link href="/admin/products" className="text-forest-600 hover:underline">
          ← Back to Product List
        </Link>
      </div>
      <h1 className="text-center">Customer Inquiries</h1>

      <div className="shadow-lg rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-stone-200 text-stone-700 text-left">
              <th className={TABLE_CELL_STYLE}>ID</th>
              <th className={TABLE_CELL_STYLE}>Full Name</th>
              <th className={TABLE_CELL_STYLE}>Email Address</th>
              <th className={TABLE_CELL_STYLE}>Message</th>
              <th className={TABLE_CELL_STYLE}>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className={cn(TABLE_CELL_STYLE, 'text-center text-stone-500')}>
                  No inquiries found.
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-stone-100">
                  <td className={TABLE_CELL_STYLE}>{inquiry.id}</td>
                  <td className={TABLE_CELL_STYLE}>{inquiry.name}</td>
                  <td className={TABLE_CELL_STYLE}>{inquiry.email}</td>
                  <td className={TABLE_CELL_STYLE}>{inquiry.message}</td>
                  <td className={TABLE_CELL_STYLE}>
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}