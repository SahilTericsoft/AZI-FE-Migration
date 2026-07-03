"use client";

import { useEffect, useState } from "react";

import { BadgeCheck, Pencil, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ListPagination } from "@/components/ui/list-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { accessControlApi } from "@/features/access-control/access-control.api";
import { useAssignUserRole, useRoles } from "@/features/access-control/access-control.queries";
import type { Role } from "@/features/access-control/access-control.types";

import { useUserList } from "../user.queries";
import { userFullName, type User } from "../user.types";
import UserFormDialog from "./user-form-dialog";

function asRoles(data: Role[] | { docs: Role[] } | undefined): Role[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.docs;
}

export default function UserManagementPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [assignFor, setAssignFor] = useState<User | null>(null);
  const [formFor, setFormFor] = useState<User | null | "new">(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, isFetching } = useUserList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const users = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div>
        <h2 className="text-2xl font-bold">User Management</h2>
        <p className="text-sm text-muted-foreground">
          Assign a role to a user and they inherit that role&apos;s module visibility — the
          sidebar tailors itself on their next sign-in.
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search users…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Button className="h-9 gap-1.5" onClick={() => setFormFor("new")}>
          <Plus className="h-4 w-4" /> New User
        </Button>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load users."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium capitalize">{userFullName(u)}</TableCell>
                  <TableCell>{u.emailId ?? "—"}</TableCell>
                  <TableCell>
                    {u.roleObj?.title ? (
                      <Badge variant="secondary">{u.roleObj.title}</Badge>
                    ) : (
                      <Badge variant="outline">No role</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setFormFor(u)}>
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setAssignFor(u)}>
                      <BadgeCheck className="h-4 w-4" /> Assign role
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ListPagination
          page={page}
          rowsPerPage={rowsPerPage}
          total={total}
          isFetching={isFetching && !isLoading}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </Card>

      {formFor && (
        <UserFormDialog
          user={formFor === "new" ? null : formFor}
          onClose={() => setFormFor(null)}
        />
      )}

      {assignFor && (
        <AssignRoleDialog
          user={assignFor}
          onClose={() => setAssignFor(null)}
          onAssigned={(roleTitle) => {
            toast.success(`${userFullName(assignFor)} is now ${roleTitle}.`);
            setAssignFor(null);
          }}
        />
      )}
    </div>
  );
}

function AssignRoleDialog({
  user,
  onClose,
  onAssigned,
}: {
  user: User;
  onClose: () => void;
  onAssigned: (roleTitle: string) => void;
}) {
  const rolesQ = useRoles();
  const roles = asRoles(rolesQ.data);
  const assign = useAssignUserRole();

  const [roleId, setRoleId] = useState<string>(user.roleId != null ? String(user.roleId) : "");
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async () => {
    if (roleId === "") return;
    const rid = Number(roleId);
    setError(null);
    try {
      const grants = await accessControlApi.roles.permissions(rid);
      const aclRules = grants.map((g) => ({ module: g.moduleAccess, code: g.featureAccess }));
      await assign.mutateAsync({ userId: user.id, body: { roleId: rid, aclRules } });
      const role = roles.find((r) => r.id === rid);
      onAssigned(role?.title ?? role?.code ?? "assigned");
    } catch (e) {
      setError((e as { message?: string })?.message ?? "Failed to assign role.");
    }
  };

  const busy = assign.isPending;

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign role — {userFullName(user)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1.5 py-1">
          <Label>Role</Label>
          <Select value={roleId} onValueChange={setRoleId} disabled={rolesQ.isLoading}>
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.title ?? r.code ?? `Role #${r.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            The user inherits this role&apos;s enabled modules. They&apos;ll see the change after
            signing in again.
          </p>
          {error && <Alert variant="destructive">{error}</Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={roleId === "" || busy} className="gap-1.5">
            {busy && <Spinner className="h-4 w-4" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
