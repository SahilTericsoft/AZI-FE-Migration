"use client";

import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ApiError } from "@/core/api/types";
import { useUserOptions } from "@/features/user/user.queries";
import { userFullName } from "@/features/user/user.types";

import { useUpdateLab } from "../../lab.queries";
import type { Lab } from "../../lab.types";

export default function AdminDetailsEdit({
  lab,
  onDone,
}: {
  lab: Lab;
  onDone: () => void;
}) {
  const { data, isLoading } = useUserOptions();
  const users = data?.docs ?? [];
  const updateLab = useUpdateLab();

  const [selectedId, setSelectedId] = useState<number | null>(lab.adminId ?? null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setError(null);
    try {
      await updateLab.mutateAsync({ id: lab.id, body: { adminId: selectedId ?? null } });
      onDone();
    } catch (e) {
      setError((e as ApiError)?.message ?? "Could not save the lab admin.");
    }
  };

  return (
    <div>
      <div className="max-w-xl space-y-1.5">
        <Label htmlFor="lab-admin">Lab Admin</Label>
        <Select
          value={selectedId != null ? String(selectedId) : undefined}
          onValueChange={(v) => setSelectedId(Number(v))}
          disabled={isLoading}
        >
          <SelectTrigger id="lab-admin">
            <SelectValue placeholder="Select Lab Admin" />
          </SelectTrigger>
          <SelectContent>
            {users.map((u) => (
              <SelectItem key={u.id} value={String(u.id)}>
                {userFullName(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Alert className="mt-3">
          Adding an admin is recommended, but if unavailable, it can be skipped and
          added later.
        </Alert>
        {error && (
          <Alert variant="destructive" className="mt-3">
            {error}
          </Alert>
        )}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Button
          variant="outline"
          onClick={onDone}
          disabled={updateLab.isPending}
          className="min-w-[220px]"
        >
          Cancel
        </Button>
        <Button onClick={save} disabled={updateLab.isPending} className="min-w-[220px]">
          {updateLab.isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
