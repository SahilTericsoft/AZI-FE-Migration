"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus } from "lucide-react";

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
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  useBiomarkerList,
  useCreateBiomarker,
  useToggleBiomarker,
} from "../test-config.queries";
import type { Biomarker } from "../test-config.types";

export default function BiomarkerTab() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching } = useBiomarkerList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });
  const toggle = useToggleBiomarker();
  const rows: Biomarker[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search biomarkers…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 max-w-xs"
        />
        <Button className="h-9 gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Biomarker
        </Button>
      </div>

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Sample Type</TableHead>
              <TableHead>Report Format</TableHead>
              <TableHead className="text-center">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-12 text-center text-muted-foreground">No biomarkers found.</TableCell></TableRow>
            ) : (
              rows.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-medium">{b.name ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{b.code ?? "—"}</Badge></TableCell>
                  <TableCell>{b.sampleType ?? "—"}</TableCell>
                  <TableCell>{b.reportFormat ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={Boolean(b.isActive)}
                      onCheckedChange={() => toggle.mutate(b.id)}
                      disabled={toggle.isPending || b.status === "draft"}
                    />
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

      {dialogOpen && <CreateBiomarkerDialog onClose={() => setDialogOpen(false)} />}
    </div>
  );
}

function CreateBiomarkerDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [sampleType, setSampleType] = useState("");
  const [reportFormat, setReportFormat] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateBiomarker();

  const valid = useMemo(() => name.trim() !== "" && code.trim() !== "", [name, code]);

  const submit = () =>
    create.mutate(
      {
        name: name.trim(),
        code: code.trim(),
        sampleType: sampleType.trim() || undefined,
        reportFormat: reportFormat.trim() || undefined,
        description: description.trim() || undefined,
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog open onOpenChange={(o) => !o && !create.isPending && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New Biomarker</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <Field label="Biomarker Name" required value={name} onChange={setName} />
          <Field label="Biomarker Code" required value={code} onChange={setCode} />
          <Field label="Sample Type" value={sampleType} onChange={setSampleType} />
          <Field label="Report Format" value={reportFormat} onChange={setReportFormat} />
          <Field label="Description" value={description} onChange={setDescription} />
          {create.isError && <Alert variant="destructive">{create.error?.message ?? "Failed to create biomarker."}</Alert>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={create.isPending}>Cancel</Button>
          <Button onClick={submit} disabled={!valid || create.isPending} className="gap-1.5">
            {create.isPending && <Spinner className="h-4 w-4" />}Create Biomarker
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, required }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}{required && <span className="text-destructive"> *</span>}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
