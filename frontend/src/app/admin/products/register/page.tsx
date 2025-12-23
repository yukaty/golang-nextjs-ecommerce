'use client';

import ProductForm from '@/components/ProductForm';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Product registration page
export default function ProductRegisterPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState(''); // Error message

  // Event handler for form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Cancel default submit behavior
    setErrorMessage(''); // Clear errors before submission

    // Generate form data
    const formData = new FormData(e.currentTarget);

    // Get each input data
    const name = formData.get('name') as string;
    const imageFile = formData.get('imageFile') as File;
    const price = Number(formData.get('price') as string);
    const stock = Number(formData.get('stock') as string);

    // Input data validation
    if (!name.trim() || !imageFile) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (price < 0 || stock < 0) {
      setErrorMessage('Price and stock must be 0 or greater.');
      return;
    }

    try { // Send POST request to product registration API
      const res = await fetch('/api/products', {
        method: 'POST',
        body: formData
      });

      if (res.ok) { // Navigate to admin product list on successful registration
        router.push('/admin/products?registered=1'); // Notify success via query parameter
      } else { // Display error info on registration failure
        const data = await res.json();
        setErrorMessage(data.error || 'Registration failed.');
      }
    } catch {
      setErrorMessage('A connection error occurred.');
    }
  };

  return (
    <main className="max-w-xl mx-auto py-10">
      <h1 className="text-center mb-6">Register Product</h1>
      {errorMessage && (
        <p className="text-red-600 text-center mb-4">{errorMessage}</p>
      )}
      <ProductForm
        onSubmit={handleSubmit}
        submitLabel="Register"
      />
    </main>
  );
}