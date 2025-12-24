import Link from 'next/link';
import { cookies } from 'next/headers';
import { AUTH_TOKEN } from '@/lib/auth';

// Inquiries table data type definition
type Inquiry = {
  id: number;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

// Customer inquiries list page
export default async function InquiriesPage() {
  // Get cookies
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_TOKEN)?.value;

  // Set HTTP request headers
  const headers: HeadersInit = {};
  if (token) {
    headers['Cookie'] = `${AUTH_TOKEN}=${token}`;
  }

  // Fetch data from inquiries API
  const res = await fetch(`${process.env.API_BASE_URL}/api/inquiries`, {
    cache: 'no-store',
    headers: headers
  });

  // Get data returned from API
  const inquiries: Inquiry[] = await res.json()
  if (!Array.isArray(inquiries)) {
    console.error('Failed to load inquiry data.');
    return <p className="text-center text-stone-500 text-lg py-10">Failed to load inquiry data.</p>;
  }

  // Common table styles
  const tableStyle = 'px-5 py-3 border-b border-stone-300';

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
              <th className={tableStyle}>ID</th>
              <th className={tableStyle}>Full Name</th>
              <th className={tableStyle}>Email Address</th>
              <th className={tableStyle}>Message</th>
              <th className={tableStyle}>Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr>
                <td colSpan={5} className={`${tableStyle} text-center text-stone-500`}>
                  No inquiries found.
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-stone-100">
                  <td className={tableStyle}>{inquiry.id}</td>
                  <td className={tableStyle}>{inquiry.name}</td>
                  <td className={tableStyle}>{inquiry.email}</td>
                  <td className={tableStyle}>{inquiry.message}</td>
                  <td className={tableStyle}>
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