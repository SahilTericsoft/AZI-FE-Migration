import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function str(rec: Record<string, unknown>, key: string): string | undefined {
  const v = rec[key];
  return v === null || v === undefined || v === "" ? undefined : String(v);
}

/** Read-only table of assigned users (facility/location). */
export default function UserDetailsTable({
  users,
}: {
  users?: Record<string, unknown>[] | null;
}) {
  const list = users ?? [];

  if (list.length === 0) {
    return <p className="py-4 text-muted-foreground">No users added.</p>;
  }

  return (
    <>
      <h3 className="mb-3 text-base font-bold">Added Providers</h3>
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
            {list.map((u, i) => {
              const role = u.roleObj as { title?: string } | undefined;
              const name = [str(u, "firstName"), str(u, "lastName")]
                .filter(Boolean)
                .join(" ");
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
    </>
  );
}
