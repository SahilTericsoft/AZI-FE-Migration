/**
 * Test Order API (PHI) — every route in `services/test_order/router.py`:
 * orders (5), order-results (5), guarantors (5), patient-visits (5).
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  Guarantor,
  Order,
  OrderCreateRequest,
  OrderEditRequest,
  OrderListQuery,
  OrderResult,
  PatientVisit,
} from "./test-order.types";

const ordersBase = `${SERVICE.testOrder}/orders`;
const resultsBase = `${SERVICE.testOrder}/order-results`;
const guarantorsBase = `${SERVICE.testOrder}/guarantors`;
const visitsBase = `${SERVICE.testOrder}/patient-visits`;

const orderResource = createResourceApi<Order, OrderCreateRequest, OrderEditRequest>(
  ordersBase,
);

export const testOrderApi = {
  // --- orders ---
  get: orderResource.get,
  create: orderResource.create,
  update: orderResource.update,
  remove: orderResource.remove,
  list: (body: OrderListQuery = {}) =>
    http.post<Paginated<Order>>(`${ordersBase}/list`, body).then((r) => r.data),
  /** Upload an order document (multipart) — Azure-backed. */
  addAttachment: (orderId: number, attachmentName: string, file: File) => {
    const fd = new FormData();
    fd.append("attachmentName", attachmentName);
    fd.append("file", file);
    return http
      .post<{ attachmentName: string; secureUrl: string }>(
        `${ordersBase}/${orderId}/attachments`,
        fd,
      )
      .then((r) => r.data);
  },
  listByPatient: (patientId: number, body: Omit<OrderListQuery, "patientId"> = {}) =>
    http
      .post<Paginated<Order>>(`${ordersBase}/list`, { ...body, patientId })
      .then((r) => r.data),

  // --- order-results ---
  results: {
    create: (body: { orderId: number } & Record<string, unknown>) =>
      http.post<OrderResult>(resultsBase, body).then((r) => r.data),
    byOrder: (orderId: number | string) =>
      http
        .get<OrderResult[]>(`${resultsBase}/by-order/${orderId}`)
        .then((r) => r.data),
    get: (id: number | string) =>
      http.get<OrderResult>(`${resultsBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<OrderResult>) =>
      http.put<OrderResult>(`${resultsBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${resultsBase}/${id}`).then((r) => r.data),
  },

  // --- guarantors ---
  guarantors: {
    create: (body: { orderId: string } & Record<string, unknown>) =>
      http.post<Guarantor>(guarantorsBase, body).then((r) => r.data),
    byOrder: (orderId: number | string) =>
      http
        .get<Guarantor | null>(`${guarantorsBase}/by-order/${orderId}`)
        .then((r) => r.data),
    get: (id: number | string) =>
      http.get<Guarantor>(`${guarantorsBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<Guarantor>) =>
      http.put<Guarantor>(`${guarantorsBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${guarantorsBase}/${id}`).then((r) => r.data),
  },

  // --- patient-visits ---
  visits: {
    create: (body: { orderId: number } & Record<string, unknown>) =>
      http.post<PatientVisit>(visitsBase, body).then((r) => r.data),
    byOrder: (orderId: number | string) =>
      http
        .get<PatientVisit | null>(`${visitsBase}/by-order/${orderId}`)
        .then((r) => r.data),
    get: (id: number | string) =>
      http.get<PatientVisit>(`${visitsBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<PatientVisit>) =>
      http.put<PatientVisit>(`${visitsBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${visitsBase}/${id}`).then((r) => r.data),
  },
};
