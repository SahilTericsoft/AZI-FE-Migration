"use client";

import { useEffect, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MultiCombobox } from "@/components/ui/combobox";
import { DetailSection } from "@/components/ui/detail";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import type { ApiError } from "@/core/api/types";
import { labApi } from "@/features/lab/lab.api";
import { useLabLiteList } from "@/features/lab/lab.queries";
import type { LabAssignment, LabAssignmentKind } from "@/features/lab/lab.types";

/**
 * Which labs offer this test/panel/biomarker. Backed by `/lab/assignments/{kind}`.
 * Shared by the panel and biomarker detail pages (and mirrors the test wizard's
 * final step).
 */
export default function AssignLabCard({
  kind,
  entityId,
}: {
  kind: LabAssignmentKind;
  entityId: number;
}) {
  const qc = useQueryClient();
  const assignKey = ["lab", "assignments", kind, entityId] as const;

  const { data: assignments = [], isLoading } = useQuery<LabAssignment[], ApiError>({
    queryKey: assignKey,
    queryFn: () => labApi.assignments.forEntity(kind, entityId),
  });
  const { data: labs = [] } = useLabLiteList();

  const labName = useMemo(() => {
    const map = new Map<number, string>();
    labs.forEach((l) => map.set(l.id, l.name ?? l.code ?? `#${l.id}`));
    return map;
  }, [labs]);

  const assignedIds = useMemo(
    () => assignments.map((a) => a.labId).filter((id): id is number => id != null),
    [assignments],
  );

  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  useEffect(() => {
    if (editing) setSelected(assignedIds.map(String));
  }, [editing, assignedIds]);

  const save = useMutation<LabAssignment[], ApiError, number[]>({
    mutationFn: (labIds) => labApi.assignments.setForEntity(kind, entityId, labIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignKey });
      toast.success("Lab assignments updated.");
      setEditing(false);
    },
    onError: (e) => toast.error(e?.message ?? "Could not update lab assignments."),
  });

  return (
    <DetailSection title="Assigned Lab(s)">
      <div className="col-span-full flex flex-col gap-3">
        {isLoading ? (
          <Spinner />
        ) : editing ? (
          <>
            <MultiCombobox
              options={labs.map((l) => ({
                value: String(l.id),
                label: l.name ?? l.code ?? `#${l.id}`,
                sublabel: l.code ?? undefined,
              }))}
              value={selected}
              onChange={setSelected}
              placeholder={labs.length === 0 ? "No labs available" : "Select labs"}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => save.mutate(selected.map(Number))}
                disabled={save.isPending}
                className="gap-1.5"
              >
                {save.isPending && <Spinner className="h-4 w-4" />} Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={save.isPending}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {assignedIds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No labs assigned — this is not orderable anywhere yet.
                </p>
              ) : (
                assignedIds.map((id) => (
                  <Badge key={id} variant="secondary">
                    {labName.get(id) ?? `#${id}`}
                  </Badge>
                ))
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="w-fit gap-1.5"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Labs
            </Button>
          </>
        )}
        {save.isError && (
          <Alert variant="destructive">{save.error?.message ?? "Failed to save."}</Alert>
        )}
      </div>
    </DetailSection>
  );
}
