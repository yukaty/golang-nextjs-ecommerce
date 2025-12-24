'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// Password change page
export default function PasswordChangePage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Cancel default submit behavior
    setErrorMessage(''); // Clear errors before submission

    const formData = new FormData(e.currentTarget);
    const oldPassword = formData.get('oldPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Input data validation
    if (!oldPassword?.trim() || !newPassword?.trim() || !confirmPassword?.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    try { // Send PUT request to password change API
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (res.ok) { // Navigate to My Account on successful change
        router.push('/account?password-changed=1');
      } else { // Display error info on change failure
        const data = await res.json();
        setErrorMessage(data.error || 'Password change failed.');
      }
    } catch {
      setErrorMessage('A connection error occurred.');
    }
  };

  // Common input field styles
  const inputStyle = 'w-full border border-stone-300 px-3 py-2 rounded-sm focus:ring-2 focus:ring-forest-500';
  // Common label styles
  const labelStyle = "block font-bold mb-1";
  // Common badge styles
  const badgeStyle = "ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-md";

  return (
    <main className="max-w-md mx-auto py-10">
      <div className="my-4">
        <Link href="/account" className="text-forest-600 hover:underline">
          ← Back to My Account
        </Link>
      </div>
      <h1 className="text-center mb-6">Change Password</h1>
      {errorMessage && (
        <p className="text-red-600 text-center mt-8">{errorMessage}</p>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-6 p-8 bg-white shadow-lg rounded-xl">
        <label className={labelStyle} htmlFor="oldPassword">
          Current Password<span className={badgeStyle}>Required</span>
        </label>
        <input type="password" id="oldPassword" name="oldPassword" required className={inputStyle} />

        <label className={labelStyle} htmlFor="newPassword">
          New Password<span className={badgeStyle}>Required</span>
        </label>
        <input type="password" id="newPassword" name="newPassword" required className={inputStyle} />

        <label className={labelStyle} htmlFor="confirmPassword">
          Confirm New Password<span className={badgeStyle}>Required</span>
        </label>
        <input type="password" id="confirmPassword" name="confirmPassword" required className={inputStyle} />

        <button type="submit" className="w-full mt-2 bg-forest-500 hover:bg-forest-600 text-white py-2 rounded-sm">
          Update
        </button>
      </form>
    </main>
  );
}