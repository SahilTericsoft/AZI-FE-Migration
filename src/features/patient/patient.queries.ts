"use client";

/** React Query hooks for patients (PHI) + insurances. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { patientApi } from "./patient.api";
import type {
  Allergy,
  Patient,
  PatientCreateRequest,
  PatientEditRequest,
  PatientInsurance,
  PatientListQuery,
  PatientToggleResult,
} from "./patient.types";

export const patientKeys = {
  all: ["patient"] as const,
  list: (query: PatientListQuery) => ["patient", "list", query] as const,
  detail: (id: number | string) => ["patient", "detail", id] as const,
  insurances: (patientId: number | string) =>
    ["patient", "insurances", patientId] as const,
  allergies: ["patient", "allergies"] as const,
};

/** Reference list of allergies, used to resolve a patient's `allergieIds`. */
export const useAllergies = (enabled = true) =>
  useQuery<Allergy[], ApiError>({
    queryKey: patientKeys.allergies,
    queryFn: async () => {
      const res = await patientApi.allergies.list({ limit: 500 });
      return Array.isArray(res) ? res : (res.docs ?? []);
    },
    staleTime: 5 * 60_000,
    enabled,
  });

export const usePatientList = (query: PatientListQuery = {}) =>
  useQuery<Paginated<Patient>, ApiError>({
    queryKey: patientKeys.list(query),
    queryFn: () => patientApi.list(query),
    placeholderData: (previous) => previous,
  });

export const usePatient = (id: number | string, enabled = true) =>
  useQuery<Patient, ApiError>({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientApi.get(id),
    enabled: enabled && id !== undefined && id !== null && id !== "",
  });

export const usePatientInsurances = (id: number | string, enabled = true) =>
  useQuery<PatientInsurance[], ApiError>({
    queryKey: patientKeys.insurances(id),
    queryFn: () => patientApi.insurances.byPatient(id),
    enabled: enabled && id !== undefined && id !== null && id !== "",
  });

export const useCreateInsurance = () => {
  const qc = useQueryClient();
  return useMutation<
    PatientInsurance,
    ApiError,
    { patientId: number } & Record<string, unknown>
  >({
    mutationFn: (body) => patientApi.insurances.create(body),
    onSuccess: (_data, body) =>
      qc.invalidateQueries({ queryKey: patientKeys.insurances(body.patientId) }),
  });
};

export const useUpdateInsurance = (patientId: number | string) => {
  const qc = useQueryClient();
  return useMutation<
    PatientInsurance,
    ApiError,
    { id: number | string; body: Partial<PatientInsurance> }
  >({
    mutationFn: ({ id, body }) => patientApi.insurances.update(id, body),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: patientKeys.insurances(patientId) }),
  });
};

export const useDeleteInsurance = (patientId: number | string) => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => patientApi.insurances.remove(id),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: patientKeys.insurances(patientId) }),
  });
};

export const useCreatePatient = () => {
  const qc = useQueryClient();
  return useMutation<Patient, ApiError, PatientCreateRequest>({
    mutationFn: patientApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
  });
};

export const useUpdatePatient = () => {
  const qc = useQueryClient();
  return useMutation<
    Patient,
    ApiError,
    { id: number | string; body: PatientEditRequest }
  >({
    mutationFn: ({ id, body }) => patientApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: patientKeys.all });
      qc.invalidateQueries({ queryKey: patientKeys.detail(id) });
    },
  });
};

export const useTogglePatient = () => {
  const qc = useQueryClient();
  return useMutation<PatientToggleResult, ApiError, number | string>({
    mutationFn: (id) => patientApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
  });
};

export const useDeletePatient = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => patientApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
  });
};

export const useRecoverPatient = () => {
  const qc = useQueryClient();
  return useMutation<{ id: number }, ApiError, number | string>({
    mutationFn: (id) => patientApi.recover(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: patientKeys.all }),
  });
};
