'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FORM_CONTAINER_STYLE } from '@/lib/constants';

interface UserFormProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  initialValues?: {
    name: string;
    email: string;
  };
  submitLabel: string;
  withPassword?: boolean;
}

export default function UserForm({
  onSubmit,
  initialValues = { name: '', email: '' },
  submitLabel,
  withPassword = false,
}: UserFormProps) {
  return (
    <form onSubmit={onSubmit} className={FORM_CONTAINER_STYLE}>
      <div className="space-y-2">
        <Label htmlFor="name" className="font-bold">
          Name <Badge variant="destructive" className="ml-2">Required</Badge>
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
        <Label htmlFor="email" className="font-bold">
          Email Address <Badge variant="destructive" className="ml-2">Required</Badge>
        </Label>
        <Input
          type="email"
          id="email"
          name="email"
          required
          defaultValue={initialValues.email}
        />
      </div>

      {withPassword && (
        <>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-bold">
              Password <Badge variant="destructive" className="ml-2">Required</Badge>
            </Label>
            <Input
              type="password"
              id="password"
              name="password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="font-bold">
              Confirm Password <Badge variant="destructive" className="ml-2">Required</Badge>
            </Label>
            <Input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              required
            />
          </div>
        </>
      )}

      <Button type="submit" className="w-full mt-2 bg-forest-600 hover:bg-forest-700">
        {submitLabel}
      </Button>
    </form>
  );
}