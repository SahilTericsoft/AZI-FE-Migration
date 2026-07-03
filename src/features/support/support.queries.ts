"use client";

/** React Query hooks for Support Center + Resources. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { supportApi } from "./support.api";
import type {
  DocumentCreateRequest,
  HelpSection,
  SystemDocument,
} from "./support.types";

const unwrap = <T>(d: T[] | Paginated<T>): T[] => (Array.isArray(d) ? d : d.docs);

export const supportKeys = {
  helpSections: ["support", "help-sections"] as const,
  documents: ["support", "documents"] as const,
};

export const useHelpSections = () =>
  useQuery<HelpSection[], ApiError>({
    queryKey: supportKeys.helpSections,
    queryFn: () => supportApi.helpSections(),
    staleTime: 5 * 60 * 1000,
  });

export const useDocuments = () =>
  useQuery<SystemDocument[], ApiError>({
    queryKey: supportKeys.documents,
    queryFn: () => supportApi.documents({ limit: 200 }).then(unwrap),
  });

export const useAddDocument = () => {
  const qc = useQueryClient();
  return useMutation<SystemDocument, ApiError, DocumentCreateRequest>({
    mutationFn: (body) => supportApi.addDocument(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.documents }),
  });
};

export const useDeleteDocument = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => supportApi.removeDocument(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: supportKeys.documents }),
  });
};
