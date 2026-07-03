"use client";

import { useState } from "react";
import Link from "next/link";

import { ChevronRight, FilePlus2, PencilLine } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListPagination } from "@/components/ui/list-pagination";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";

import { useResultSessions } from "../result.queries";
import type { ResultSession } from "../result.types";
import ManualEntryDialog from "./manual-entry-dialog";
import NewResultFileDialog from "./new-result-file-dialog";

function addedBy(s: ResultSession): string {
  const c = (s.createdByDetails ?? null) as Record<string, unknown> | null;
  if (!c) return "—";
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "—";
}
function statusBadge(s: ResultSession) {
  const st = (s.status ?? "").toLowerCase();
  if (st === "completed") return <Badge variant="success">Completed</Badge>;
  if (st === "discarded" || st === "rejected") return <Badge variant="destructive">{s.status}</Badge>;
  if (st === "pendingreview") return <Badge variant="secondary">Pending Review</Badge>;
  return <Badge variant="outline">{s.status ?? "Draft"}</Badge>;
}

function SessionsTable({ statuses, emptyText }: { statuses?: string[]; emptyText: string }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const { data, isLoading, isError, error, isFetching } = useResultSessions({
    page: page + 1,
    limit: rowsPerPage,
    statuses,
  });
  const sessions = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load sessions."}</Alert>}
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Worklist</TableHead>
              <TableHead>Samples</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added By</TableHead>
              <TableHead>Created On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : sessions.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">{emptyText}</TableCell></TableRow>
            ) : (
              sessions.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">#{s.id}</TableCell>
                  <TableCell>{s.isManual ? "Manual Entry" : s.fileName ?? "Run File"}</TableCell>
                  <TableCell>{s.worklistId ? `#${s.worklistId}` : "—"}</TableCell>
                  <TableCell>{s.accessionIds?.length ?? 0}</TableCell>
                  <TableCell>{statusBadge(s)}</TableCell>
                  <TableCell className="capitalize">{addedBy(s)}</TableCell>
                  <TableCell>{s.createdAt ? formatDateTime(s.createdAt) : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Link href={`/result/${s.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
                      <ChevronRight className="h-4 w-4" /> View
                    </Link>
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
          rowsPerPageOptions={[10, 25, 100]}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => { setRowsPerPage(n); setPage(0); }}
        />
      </Card>
    </>
  );
}

export default function ResultPage() {
  const [manualOpen, setManualOpen] = useState(false);
  const [fileOpen, setFileOpen] = useState(false);

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <h2 className="text-2xl font-bold">Result</h2>

      <Card className="p-0">
        <Tabs defaultValue="upload">
          <TabsList className="w-full px-2">
            <TabsTrigger value="upload">Upload Result</TabsTrigger>
            <TabsTrigger value="review">Result Review</TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="upload" className="mt-0 flex flex-col gap-4">
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="gap-1.5" onClick={() => setManualOpen(true)}>
                  <PencilLine className="h-4 w-4" /> Manual Entry
                </Button>
                <Button className="gap-1.5" onClick={() => setFileOpen(true)}>
                  <FilePlus2 className="h-4 w-4" /> New Result File
                </Button>
              </div>
              <SessionsTable emptyText="No result sessions yet." />
            </TabsContent>

            <TabsContent value="review" className="mt-0">
              <SessionsTable statuses={["pendingReview"]} emptyText="No results pending review." />
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {manualOpen && <ManualEntryDialog onClose={() => setManualOpen(false)} />}
      {fileOpen && <NewResultFileDialog onClose={() => setFileOpen(false)} />}
    </div>
  );
}
