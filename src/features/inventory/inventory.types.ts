/** Inventory module types — mirror `services/inventory`. */

import type { BaseEntity } from "@/core/api/types";

export interface InventoryItem extends BaseEntity {
  name: string | null;
  type?: string | null;
  quantity?: number | null;
  department?: number | null;
  category?: string | null;
  units?: string | null;
  storageLocation?: string | null;
  alertQuantity?: number | null;
  description?: string | null;
  image?: Record<string, unknown> | null;
  isSubItems?: boolean | null;
  status?: string | null;
  createdBy?: number | null;
  createdByDetails?: Record<string, unknown> | null;
  isLowStock?: boolean | null;
}

export interface InventorySubItem extends BaseEntity {
  inventoryItemId?: number | null;
  name: string | null;
  units?: string | null;
  alertQuantity?: number | null;
  description?: string | null;
  quantity?: number | null;
}

export interface InventoryQuantity extends BaseEntity {
  itemId?: number | null;
  subItemId?: number | null;
  lotNumber?: string | null;
  quantity?: number | null;
  expiaryDate?: string | null;
  manufacturer?: string | null;
  batch?: string | null;
  catalog?: string | null;
  price?: string | null;
  event?: string | null; // add | remove | usage
  reason?: string | null;
  isRemoved?: boolean | null;
  createdByDetails?: Record<string, unknown> | null;
}

export interface InventoryListQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  department?: number;
  lowStock?: boolean;
}
