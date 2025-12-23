'use client';

import { useRouter } from 'next/navigation';

// Delete link component
export default function DeleteLink({ id, name }: { id: number; name: string }) {
  const router = useRouter();

  // Event handler for delete link click
  const handleDelete = async () => {
    if (!confirm(`Deleting "${name}" is irreversible.\nAre you sure you want to delete?`)) {
      return; // Cancel deletion
    }

    try { // Send DELETE request to product deletion API
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });

      if (res.ok) { // Refresh admin product list on successful deletion
        router.push(`/admin/products?deleted=1`); // Notify success via query parameter
      } else { // Display error info on deletion failure
        const data = await res.json();
        alert(data.error || 'Deletion failed.');
      }
    } catch {
      alert('A connection error occurred.');
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-700 cursor-pointer"
    >
      Delete
    </button>
  )
}