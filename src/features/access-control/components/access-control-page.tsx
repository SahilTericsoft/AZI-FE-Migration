"use client";

import { useEffect, useMemo, useState } from "react";

import { Lock, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import { useAuth } from "@/features/auth/auth-context";

import {
  useAclModules,
  useCreateRole,
  useRolePermissions,
  useRoles,
  useSetRolePermissions,
} from "../access-control.queries";
import { accessControlApi } from "../access-control.api";
import type { AclModule, Role } from "../access-control.types";

function asRoles(data: Role[] | { docs: Role[] } | undefined): Role[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.docs;
}

export default function AccessControlPage() {
  const { refreshSession, user } = useAuth();
  const rolesQ = useRoles();
  const modulesQ = useAclModules();
  const roles = asRoles(rolesQ.data);

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [newRoleOpen, setNewRoleOpen] = useState(false);

  useEffect(() => {
    if (selectedRoleId == null && roles.length > 0) setSelectedRoleId(roles[0].id);
  }, [roles, selectedRoleId]);

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;
  const modulesEmpty = !modulesQ.isLoading && (modulesQ.data?.length ?? 0) === 0;

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Access Level</h2>
          <p className="text-sm text-muted-foreground">
            Toggle a feature for a role and it appears/disappears in that role&apos;s
            sidebar — no role ids, the permission code is the switch.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setNewRoleOpen(true)}>
          <Plus className="h-4 w-4" /> New Role
        </Button>
      </div>

      {modulesEmpty && (
        <Alert className="flex items-center justify-between">
          <span>No ACL feature catalog found in the backend yet.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await accessControlApi.seedModules();
              modulesQ.refetch();
              toast.success("Default ACL catalog loaded.");
            }}
          >
            Load default catalog
          </Button>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-[280px_1fr]">
        <Card className="overflow-hidden">
          <p className="px-4 py-3 font-semibold">Roles</p>
          <div className="h-px bg-border" />
          {rolesQ.isLoading ? (
            <div className="p-6 text-center">
              <Spinner className="mx-auto" />
            </div>
          ) : roles.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">
              No roles yet. Create one to start assigning permissions.
            </p>
          ) : (
            <div className="p-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted",
                    role.id === selectedRoleId && "bg-primary/10 text-primary",
                  )}
                >
                  <span>
                    <span className="block font-medium">
                      {role.title ?? role.code ?? `Role #${role.id}`}
                    </span>
                    {role.code === "superAdmin" && (
                      <span className="text-xs text-muted-foreground">Sees everything</span>
                    )}
                  </span>
                  {role.code === "superAdmin" && <Lock className="h-4 w-4 text-muted-foreground/50" />}
                </button>
              ))}
            </div>
          )}
        </Card>

        {selectedRole ? (
          <PermissionMatrix
            key={selectedRole.id}
            role={selectedRole}
            modules={modulesQ.data ?? []}
            modulesLoading={modulesQ.isLoading}
            onSaved={() => {
              toast.success(`Permissions updated for ${selectedRole.title ?? "role"}.`);
              if (user?.roleId === selectedRole.id) refreshSession();
            }}
          />
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            Select a role to edit its permissions.
          </Card>
        )}
      </div>

      {newRoleOpen && (
        <NewRoleDialog
          onClose={() => setNewRoleOpen(false)}
          onCreated={(id) => {
            setSelectedRoleId(id);
            setNewRoleOpen(false);
            rolesQ.refetch();
          }}
        />
      )}
    </div>
  );
}

function PermissionMatrix({
  role,
  modules,
  modulesLoading,
  onSaved,
}: {
  role: Role;
  modules: AclModule[];
  modulesLoading: boolean;
  onSaved: () => void;
}) {
  const permsQ = useRolePermissions(role.id);
  const save = useSetRolePermissions();
  const isSuperAdmin = role.code === "superAdmin";

  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (permsQ.data) setChecked(new Set(permsQ.data.map((g) => g.featureAccess)));
  }, [permsQ.data]);

  const grouped = useMemo(() => {
    const map = new Map<string, AclModule[]>();
    for (const m of modules) {
      if (!map.has(m.module)) map.set(m.module, []);
      map.get(m.module)!.push(m);
    }
    return [...map.entries()];
  }, [modules]);

  const toggle = (code: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });

  const toggleModule = (codes: string[], on: boolean) =>
    setChecked((prev) => {
      const next = new Set(prev);
      codes.forEach((c) => (on ? next.add(c) : next.delete(c)));
      return next;
    });

  const handleSave = () => {
    const aclRules = modules
      .filter((m) => checked.has(m.code))
      .map((m) => ({ module: m.module, code: m.code, feature: m.feature }));
    save.mutate({ roleId: role.id, aclRules }, { onSuccess: onSaved });
  };

  return (
    <Card>
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <p className="font-semibold">Permissions — {role.title ?? role.code}</p>
          <p className="text-xs text-muted-foreground">{checked.size} feature(s) enabled</p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSuperAdmin || save.isPending || permsQ.isLoading}
          className="gap-1.5"
        >
          {save.isPending && <Spinner className="h-4 w-4" />}
          Save Permissions
        </Button>
      </div>
      <div className="h-px bg-border" />

      {isSuperAdmin && (
        <Alert className="m-3">
          The <strong>superAdmin</strong> role implicitly has every permission — it isn&apos;t
          editable here.
        </Alert>
      )}

      {modulesLoading || permsQ.isLoading ? (
        <div className="p-8 text-center">
          <Spinner className="mx-auto" />
        </div>
      ) : (
        <div className={cn("flex flex-col gap-3 p-3", isSuperAdmin && "pointer-events-none opacity-50")}>
          {grouped.map(([moduleName, features]) => {
            const codes = features.map((f) => f.code);
            const all = codes.every((c) => checked.has(c));
            const some = !all && codes.some((c) => checked.has(c));
            return (
              <Card key={moduleName} className="p-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 font-semibold">
                    <Checkbox
                      checked={all ? true : some ? "indeterminate" : false}
                      onCheckedChange={(c) => toggleModule(codes, c === true)}
                    />
                    {moduleName}
                  </label>
                  <Badge variant="outline">
                    {codes.filter((c) => checked.has(c)).length}/{codes.length}
                  </Badge>
                </div>
                <div className="my-2 h-px bg-border" />
                <div className="grid grid-cols-1 gap-1 pl-1 sm:grid-cols-2">
                  {features.map((f) => (
                    <label key={f.code} className="flex items-start gap-2 py-0.5">
                      <Checkbox
                        className="mt-0.5"
                        checked={checked.has(f.code)}
                        onCheckedChange={() => toggle(f.code)}
                      />
                      <span>
                        <span className="block text-sm">{f.feature ?? f.code}</span>
                        <span className="block text-xs text-muted-foreground">{f.code}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function NewRoleDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (roleId: number) => void;
}) {
  const [name, setName] = useState("");
  const create = useCreateRole();

  const handleCreate = async () => {
    await create.mutateAsync({ role: name.trim(), aclRules: [] });
    const list = await accessControlApi.roles.list({ search: name.trim() });
    const created = (Array.isArray(list) ? list : list.docs).find(
      (r) => r.title === name.trim() || r.code === name.trim(),
    );
    if (created) onCreated(created.id);
    else onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Role</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label htmlFor="role-name">Role Name</Label>
          <Input id="role-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          <p className="text-xs text-muted-foreground">e.g. Lab Technician, Front Desk</p>
          {create.isError && (
            <Alert variant="destructive">{create.error?.message ?? "Failed to create role."}</Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={name.trim() === "" || create.isPending}
            className="gap-1.5"
          >
            {create.isPending && <Spinner className="h-4 w-4" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
