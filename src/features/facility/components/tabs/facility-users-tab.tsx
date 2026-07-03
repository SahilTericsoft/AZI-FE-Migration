import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Facility } from "../../facility.types";

function str(rec: Record<string, unknown>, key: string): string | undefined {
  const v = rec[key];
  return v === null || v === undefined || v === "" ? undefined : String(v);
}

export default function FacilityUsersTab({ facility }: { facility: Facility }) {
  const users = (facility.userDetails ?? []) as Record<string, unknown>[];

  if (users.length === 0) {
    return <p className="py-4 text-muted-foreground">No users added.</p>;
  }

  return (
    <div>
      <h3 className="mb-2 text-base font-bold">Added Providers</h3>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Mobile Number</TableHead>
              <TableHead>Email ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Assigned Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u, i) => {
              const role = u.roleObj as { title?: string } | undefined;
              const name = [str(u, "firstName"), str(u, "lastName")].filter(Boolean).join(" ");
              return (
                <TableRow key={(str(u, "id") ?? i) as string}>
                  <TableCell>{str(u, "id") ?? "—"}</TableCell>
                  <TableCell className="capitalize">{name || "—"}</TableCell>
                  <TableCell className="capitalize">{str(u, "gender") ?? "—"}</TableCell>
                  <TableCell>{str(u, "mobileNumber") ?? "—"}</TableCell>
                  <TableCell>{str(u, "emailId") ?? "—"}</TableCell>
                  <TableCell>{role?.title ?? "—"}</TableCell>
                  <TableCell>—</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
