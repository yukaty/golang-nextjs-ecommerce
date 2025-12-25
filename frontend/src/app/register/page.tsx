'use client';

import UserForm from '@/components/UserForm';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ERROR_MESSAGE_STYLE, CONNECTION_ERROR_MESSAGE } from '@/lib/constants';
import { handleApiResponse } from '@/lib/api';

export default function UserRegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (!name?.trim() || !email?.trim() || !password?.trim() || !confirmPassword?.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
        headers: { 'Content-Type': 'application/json' }
      });

      const { error } = await handleApiResponse<unknown>(res);

      if (error) {
        setErrorMessage(error);
        return;
      }

      router.push('/?registered=1');
    } catch {
      setErrorMessage(CONNECTION_ERROR_MESSAGE);
    }
  };

  return (
    <main className="max-w-md mx-auto py-10">
      <h1 className="text-center mb-4">Register</h1>
      {errorMessage && (
        <p className={`${ERROR_MESSAGE_STYLE} mt-8`}>{errorMessage}</p>
      )}
      <UserForm
        onSubmit={handleSubmit}
        withPassword={true}
        submitLabel="Register"
      />
    </main>
  );
}