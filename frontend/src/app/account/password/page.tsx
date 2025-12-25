'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FORM_CONTAINER_STYLE, ERROR_MESSAGE_STYLE, CONNECTION_ERROR_MESSAGE } from '@/lib/constants';
import { handleApiResponse } from '@/lib/api';

export default function PasswordChangePage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const oldPassword = formData.get('oldPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!oldPassword?.trim() || !newPassword?.trim() || !confirmPassword?.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/users/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const { error } = await handleApiResponse<unknown>(res);

      if (error) {
        setErrorMessage(error);
        return;
      }

      router.push('/account?password-changed=1');
    } catch {
      setErrorMessage(CONNECTION_ERROR_MESSAGE);
    }
  };

  return (
    <main className="max-w-md mx-auto py-10">
      <div className="my-4">
        <Link href="/account" className="text-forest-600 hover:underline">
          ← Back to My Account
        </Link>
      </div>
      <h1 className="text-center mb-6">Change Password</h1>
      {errorMessage && (
        <p className={`${ERROR_MESSAGE_STYLE} mt-8`}>{errorMessage}</p>
      )}

      <form onSubmit={handleSubmit} className={FORM_CONTAINER_STYLE}>
        <div className="space-y-2">
          <Label htmlFor="oldPassword" className="font-bold">
            Current Password <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="password" id="oldPassword" name="oldPassword" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword" className="font-bold">
            New Password <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="password" id="newPassword" name="newPassword" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="font-bold">
            Confirm New Password <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="password" id="confirmPassword" name="confirmPassword" required />
        </div>

        <Button type="submit" className="w-full mt-2">
          Update
        </Button>
      </form>
    </main>
  );
}