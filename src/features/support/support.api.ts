/** Support API — `services/support/router.py` (mounted at `/support`). */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  DocumentCreateRequest,
  HelpSection,
  SystemDocument,
} from "./support.types";

const base = SERVICE.support;

export const supportApi = {
  /**
   * Support Center content — same endpoint the existing UI uses
   * (`/helpSection/getHelpSectionsListLiteClient`). Returns the modules and the
   * content (sections + attachments) inside them; the UI renders whatever comes
   * back.
   */
  helpSections: () =>
    http
      .get<HelpSection[]>(`/helpSection/getHelpSectionsListLiteClient`)
      .then((r) => r.data),
  documents: (body: Record<string, unknown> = {}) =>
    http
      .post<SystemDocument[] | Paginated<SystemDocument>>(`${base}/documents/list`, body)
      .then((r) => r.data),
  addDocument: (body: DocumentCreateRequest) =>
    http.post<SystemDocument>(`${base}/documents`, body).then((r) => r.data),
  removeDocument: (id: number | string) =>
    http.del<unknown>(`${base}/documents/${id}`).then((r) => r.data),
};
