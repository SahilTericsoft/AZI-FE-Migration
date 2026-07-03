"use client";

/** Geo / ZIP lookup — `user-service/static-data/geo` (StateCityStaticData). */

import { useQuery } from "@tanstack/react-query";

import { http } from "@/core/api/client";
import { USER_SERVICE } from "@/core/api/endpoints";
import type { ApiError, Paginated } from "@/core/api/types";

export interface ZipRow {
  zipcode: string;
  city: string;
  state: string;
  county?: string | null;
  country?: string | null;
}

/** Debounced server-side ZIP search (handles the full US dataset). */
export const useZipSearch = (search: string, enabled = true) =>
  useQuery<ZipRow[], ApiError>({
    queryKey: ["geo", "zipcodes", search],
    queryFn: () =>
      http
        .get<Paginated<ZipRow>>(`${USER_SERVICE.staticData}/geo`, {
          params: { type: "zipcodes", search: search || undefined, limit: 25 },
        })
        .then((r) => r.data.docs),
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
