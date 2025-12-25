"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FORM_CONTAINER_STYLE } from '@/lib/constants';

interface ProductFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  initialValues?: {
    name: string;
    image_url?: string | null | undefined;
    description?: string | null | undefined;
    price: number;
    stock?: number;
    is_featured?: boolean;
  };
  submitLabel: string;
}

export default function ProductForm({
  onSubmit,
  initialValues = {
    name: "",
    image_url: "",
    description: "",
    price: 0,
    stock: 0,
    is_featured: false,
  },
  submitLabel,
}: ProductFormProps) {
  const router = useRouter();
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (initialValues.image_url) {
      setPreviewUrl(`/uploads/${initialValues.image_url}`);
    }
  }, [initialValues.image_url]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPreviewUrl("");
      return;
    }
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleCancel = () => {
    if (confirm("Discard changes? Are you sure?")) {
      router.push("/admin/products");
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      encType="multipart/form-data"
      className={FORM_CONTAINER_STYLE}
    >
      <div className="space-y-2">
        <Label htmlFor="name" className="font-bold">
          Product Name <Badge variant="destructive" className="ml-2">Required</Badge>
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={initialValues.name}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageFile" className="font-bold">
          Product Image <Badge variant="destructive" className="ml-2">Required</Badge>
        </Label>
        <div className="flex flex-col gap-6 mt-2">
          <Input
            type="file"
            id="imageFile"
            name="imageFile"
            required={!initialValues.image_url}
            accept="image/*"
            onChange={handleImageChange}
            className="text-stone-600 file:bg-stone-50 file:border file:border-stone-300 file:px-4 file:py-2 file:rounded-sm file:cursor-pointer"
          />
          {previewUrl && (
            <div className="px-8" id="imagePreview">
              <img
                src={previewUrl}
                alt="preview"
                className="object-cover rounded-md shadow-md"
              />
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="font-bold">
          Description
        </Label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={initialValues.description ?? ""}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="price" className="font-bold">
          Price (incl. tax) <Badge variant="destructive" className="ml-2">Required</Badge>
        </Label>
        <Input
          type="number"
          id="price"
          name="price"
          required
          min="0"
          step="1"
          defaultValue={initialValues.price}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="stock" className="font-bold">
          Stock <Badge variant="destructive" className="ml-2">Required</Badge>
        </Label>
        <Input
          type="number"
          id="stock"
          name="stock"
          required
          min="0"
          step="1"
          defaultValue={initialValues.stock}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="isFeatured" className="font-bold">
          <input
            type="checkbox"
            id="isFeatured"
            name="isFeatured"
            defaultChecked={initialValues.is_featured}
            className="mr-2"
          />
          Display as featured product
        </Label>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <Button
          type="button"
          onClick={handleCancel}
          variant="secondary"
          className="w-1/2"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="w-1/2"
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
