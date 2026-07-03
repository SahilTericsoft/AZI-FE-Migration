"use client";

import { useMemo, useState } from "react";

import { Plus, SquareArrowOutUpRight, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

import { useAddDocument, useDeleteDocument, useDocuments } from "../support.queries";

export default function ResourcesPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: docs = [], isLoading, isError, error } = useDocuments();
  const del = useDeleteDocument();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return docs;
    return docs.filter(
      (d) =>
        (d.title ?? "").toLowerCase().includes(q) ||
        (d.description ?? "").toLowerCase().includes(q),
    );
  }, [docs, search]);

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resources</h2>
        <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Document
        </Button>
      </div>

      <Input
        placeholder="Search documents…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-9 max-w-xs"
      />

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load documents."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
                  No documents found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{d.description ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    {d.url && (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="open"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                      >
                        <SquareArrowOutUpRight className="h-4 w-4" />
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="delete"
                      disabled={del.isPending}
                      onClick={() => {
                        if (window.confirm(`Delete "${d.title}"?`)) del.mutate(d.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {addOpen && <AddDocumentDialog onClose={() => setAddOpen(false)} />}
    </div>
  );
}

function AddDocumentDialog({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const add = useAddDocument();

  const valid = title.trim() !== "" && /^https?:\/\/.+/.test(url.trim());

  const handleAdd = () => {
    add.mutate(
      { title: title.trim(), url: url.trim(), description: description.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !add.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Document</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 32))}
            />
            <p className="text-xs text-muted-foreground">{title.length}/32</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-url">URL</Label>
            <Input
              id="doc-url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…"
              aria-invalid={url.trim() !== "" && !/^https?:\/\/.+/.test(url.trim())}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-desc">Description</Label>
            <Textarea id="doc-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {add.isError && (
            <Alert variant="destructive">{add.error?.message ?? "Failed to add document."}</Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={add.isPending}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!valid || add.isPending} className="gap-1.5">
            {add.isPending && <Spinner className="h-4 w-4" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
