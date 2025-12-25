'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FORM_CONTAINER_STYLE, ERROR_MESSAGE_STYLE, CONNECTION_ERROR_MESSAGE } from '@/lib/constants';
import { handleApiResponse } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email?.trim() || !password?.trim()) {
      setErrorMessage('Please enter your email address and password.');
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const { data, error } = await handleApiResponse<{ isAdmin: boolean }>(res);

      if (error) {
        setErrorMessage(error);
        return;
      }

      if (data?.isAdmin) {
        router.push('/admin/products');
      } else if (redirect) {
        router.replace(redirect);
      } else {
        router.push('/?logged-in=1');
      }
      router.refresh();
    } catch {
      setErrorMessage(CONNECTION_ERROR_MESSAGE);
    }
  };

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-center mb-6">Log In</h1>

      {errorMessage && (
        <p className={`${ERROR_MESSAGE_STYLE} mb-4`}>{errorMessage}</p>
      )}
      <form onSubmit={handleSubmit} className={FORM_CONTAINER_STYLE}>
        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold">
            Email Address <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="email" id="email" name="email" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="font-bold">
            Password <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="password" id="password" name="password" required />
        </div>

        <Button type="submit" className="w-full mt-6">
          Log In
        </Button>

        <div className="text-center mt-4">
          <Link href="/register" className="text-forest-600 hover:underline">
            Register here
          </Link>
        </div>
      </form>
    </main>
  );
}