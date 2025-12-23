import Link from 'next/link';
import { getAuthUser } from '@/lib/auth';
import UserEditForm from '@/app/account/edit/UserEditForm';

export default async function UserEditPage() {
  const user = await getAuthUser();
  if (!user) {
    return <p className="text-center mt-10">Please log in.</p>;
  }

  return (
    <main className="max-w-md mx-auto py-10">
      <div className="my-4">
        <Link href="/account" className="text-indigo-600 hover:underline">
          ← Back to My Account
        </Link>
      </div>
      <h1 className="text-center mb-4">Edit Profile</h1>
      <UserEditForm initialValues={{ name: user.name, email: user.email }} />
    </main>
  );
}