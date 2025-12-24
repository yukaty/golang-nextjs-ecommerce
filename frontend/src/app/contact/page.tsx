'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Contact page
export default function ContactPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState('');

  // Event handler for form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Cancel default submit behavior
    setErrorMessage('');

    const formData = new FormData(e.currentTarget);
    const name = (formData.get('name') as string)?.trim();
    const email = (formData.get('email') as string)?.trim();
    const message = (formData.get('message') as string)?.trim();

    // Input data validation
    if (!name || !email || !message) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    try { // Send POST request to inquiry registration API
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({ name, email, message }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) { // Navigate to top page on successful submission
        router.push('/?submitted=1');
      } else { // Display error info on submission failure
        const data = await res.json();
        setErrorMessage(data.error || 'Submission failed.');
      }
    } catch {
      setErrorMessage('A connection error occurred.');
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10">
      <div className="my-4">
        <Link href="/" className="text-forest-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
      <h1 className="text-center mb-6">Contact Us</h1>
      {errorMessage && <p className="text-red-600 text-center mb-4">{errorMessage}</p>}
      <form onSubmit={handleSubmit} className="w-full space-y-6 p-8 bg-white shadow-lg rounded-xl">
        <div className="space-y-2">
          <Label htmlFor="name" className="font-bold">
            Full Name <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="text" id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="font-bold">
            Email Address <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <Input type="email" id="email" name="email" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message" className="font-bold">
            Message <Badge variant="destructive" className="ml-2">Required</Badge>
          </Label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </div>

        <Button type="submit" className="w-full mt-2 bg-forest-600 hover:bg-forest-700">
          Submit
        </Button>
      </form>
    </main>
  );
}