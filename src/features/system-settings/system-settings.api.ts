/** System Settings API.
 *
 *  - dropdowns  → generic value sets   (`/static-data/dropdowns`)
 *  - geo        → address / zipcode    (`/static-data/geo`)
 *  - departments→ Departments entity   (`/lab-os/departments`)
 *  - orderReports→ Auto Triggers        (`/lab-os/order-reports`)
 *  - panels     → panel picklist        (`/test-config/panels/list-lite`)
 */

import { http } from "@/core/api/client";
import { SERVICE, USER_SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  Department,
  DropdownOption,
  GeoRow,
  OrderReportHeader,
  OrderReportListQuery,
} from "./system-settings.types";

const DD = `${USER_SERVICE.staticData}/dropdowns`;
const GEO = `${USER_SERVICE.staticData}/geo`;
const DEPT = `${SERVICE.labOs}/departments`;
const OR = `${SERVICE.labOs}/order-reports`;

export const settingsApi = {
  // --- generic dropdown value sets ---
  getDropdown: (code: string) =>
    http.get<DropdownOption[]>(`${DD}/${code}`).then((r) => r.data ?? []),
  addDropdown: (title: string, value: DropdownOption[]) =>
    http.put<DropdownOption[]>(DD, { title, value }).then((r) => r.data),
  deleteDropdown: (title: string, codes: string[]) =>
    http.del<DropdownOption[]>(DD, { data: { title, codes } }).then((r) => r.data),

  // --- address / geo ---
  getGeo: (search?: string, page = 1, limit = 25) =>
    http
      .get<Paginated<GeoRow>>(GEO, {
        params: { type: "zipcodes", page, limit, ...(search ? { search } : {}) },
      })
      .then((r) => r.data),
  addGeo: (address: Partial<GeoRow>[]) => http.post<GeoRow[]>(GEO, { address }).then((r) => r.data),
  deleteGeo: (zipcodes: string[]) =>
    http.del<unknown>(GEO, { data: { zipcodes } }).then((r) => r.data),

  // --- departments ---
  listDepartments: (search?: string) =>
    http
      .post<Paginated<Department>>(`${DEPT}/list`, { page: 1, limit: 100, ...(search ? { search } : {}) })
      .then((r) => r.data),
  addDepartment: (body: Record<string, unknown>) =>
    http.post<Department>(DEPT, body).then((r) => r.data),
  editDepartment: (id: number | string, body: Record<string, unknown>) =>
    http.put<Department>(`${DEPT}/${id}`, body).then((r) => r.data),
  deleteDepartment: (id: number | string) => http.del<unknown>(`${DEPT}/${id}`).then((r) => r.data),

  // --- auto triggers / order reports ---
  listOrderReports: (body: OrderReportListQuery = {}) =>
    http.post<Paginated<OrderReportHeader>>(`${OR}/list`, body).then((r) => r.data),
  addOrderReport: (body: Record<string, unknown>) =>
    http.post<OrderReportHeader>(OR, body).then((r) => r.data),
  toggleOrderReport: (id: number | string) =>
    http.put<OrderReportHeader>(`${OR}/${id}/toggle`).then((r) => r.data),

  // --- panels picklist (order-report testIds) ---
  panelsLite: () =>
    http
      .post<{ id: number; name: string }[] | Paginated<{ id: number; name: string }>>(
        `${SERVICE.testConfig}/panels/list-lite`,
        { isActive: true },
      )
      .then((r) => {
        const d = r.data as unknown;
        return Array.isArray(d) ? d : ((d as Paginated<{ id: number; name: string }>)?.docs ?? []);
      }),
};
