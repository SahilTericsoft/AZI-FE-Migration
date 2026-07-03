/** Inventory API — `services/inventory` items / sub-items / quantities. */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  InventoryItem,
  InventoryListQuery,
  InventoryQuantity,
  InventorySubItem,
} from "./inventory.types";

const base = SERVICE.inventory;

export const inventoryApi = {
  list: (body: InventoryListQuery = {}) =>
    http.post<Paginated<InventoryItem>>(`${base}/items/list`, body).then((r) => r.data),
  get: (id: number | string) => http.get<InventoryItem>(`${base}/items/${id}`).then((r) => r.data),
  create: (body: Record<string, unknown>) => http.post<InventoryItem>(`${base}/items`, body).then((r) => r.data),
  update: (id: number | string, body: Record<string, unknown>) =>
    http.put<InventoryItem>(`${base}/items/${id}`, body).then((r) => r.data),
  remove: (id: number | string) => http.del<unknown>(`${base}/items/${id}`).then((r) => r.data),
  toggle: (id: number | string) =>
    http.put<{ id: number; isActive: boolean }>(`${base}/items/${id}/toggle`).then((r) => r.data),
  lotNumbers: (id: number | string) => http.get<string[]>(`${base}/items/${id}/lot-numbers`).then((r) => r.data),

  subItems: (id: number | string) => http.get<InventorySubItem[]>(`${base}/items/${id}/sub-items`).then((r) => r.data),
  addSubItem: (body: Record<string, unknown>) => http.post<InventorySubItem>(`${base}/sub-items`, body).then((r) => r.data),
  removeSubItem: (id: number | string) => http.del<unknown>(`${base}/sub-items/${id}`).then((r) => r.data),

  quantities: (id: number | string) => http.get<InventoryQuantity[]>(`${base}/items/${id}/quantities`).then((r) => r.data),
  addQuantity: (body: Record<string, unknown>) => http.post<InventoryQuantity>(`${base}/quantities/add`, body).then((r) => r.data),
  removeQuantity: (body: Record<string, unknown>) => http.post<InventoryQuantity>(`${base}/quantities/remove`, body).then((r) => r.data),
};
