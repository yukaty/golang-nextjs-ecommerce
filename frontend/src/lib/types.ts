/**
 * Common type definitions used across the application
 */

import { type ProductData } from '@/types/product';

export type ProductListItem = Pick<
  ProductData,
  'id' | 'name' | 'price' | 'image_url' | 'review_avg' | 'review_count'
>;

export type ProductAdminItem = Pick<
  ProductData,
  'id' | 'name' | 'price' | 'stock' | 'updated_at'
>;

