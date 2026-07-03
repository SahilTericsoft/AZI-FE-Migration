"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ChevronDown, ChevronRight, Eye, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/ui/list-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/cn";
import { useDepartmentOptions } from "@/features/lab-os/lab-os.queries";

import { useInventoryItems, useSubItems, useToggleItem } from "../inventory.queries";
import type { InventoryItem } from "../inventory.types";

export default function InventoryList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [stock, setStock] = useState("all"); // all | low
  const [statusFilter, setStatusFilter] = useState("all"); // all | active | inactive
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const departments = useDepartmentOptions();
  const deptOptions = useMemo(() => (departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name ?? `#${d.id}` })), [departments.data]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput.trim()); setPage(0); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);
  useEffect(() => setPage(0), [department, stock, statusFilter]);

  const { data, isLoading, isError, error, isFetching } = useInventoryItems({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    department: department === "all" ? undefined : Number(department),
    lowStock: stock === "low" ? true : undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter === "active",
  });
  const toggle = useToggleItem();
  const rows: InventoryItem[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  const toggleExpand = (id: number) =>
    setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Inventory</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Search name / category…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="h-9 w-48" />
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="h-9 w-40"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {deptOptions.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stock} onValueChange={setStock}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stock</SelectItem>
              <SelectItem value="low">Low Stock</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Link href="/inventory/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" /> New Item
          </Link>
        </div>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load inventory."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Item ID</TableHead>
              <TableHead>Item Name</TableHead>
              <TableHead>Qty Avail.</TableHead>
              <TableHead>Item Type</TableHead>
              <TableHead>Item Status</TableHead>
              <TableHead className="text-center">Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center"><Spinner className="mx-auto" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="py-12 text-center text-muted-foreground">No inventory items found.</TableCell></TableRow>
            ) : (
              rows.map((it) => (
                <ItemRow key={it.id} item={it} expanded={expanded.has(it.id)} onExpand={() => toggleExpand(it.id)} onToggle={() => toggle.mutate(it.id)} toggling={toggle.isPending} />
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
    </div>
  );
}

function ItemRow({
  item, expanded, onExpand, onToggle, toggling,
}: {
  item: InventoryItem;
  expanded: boolean;
  onExpand: () => void;
  onToggle: () => void;
  toggling: boolean;
}) {
  const subQ = useSubItems(expanded && item.isSubItems ? item.id : "");
  const lowStock = item.isLowStock || (item.quantity != null && item.alertQuantity != null && item.quantity <= item.alertQuantity);

  return (
    <>
      <TableRow>
        <TableCell>
          {item.isSubItems ? (
            <button type="button" onClick={onExpand} aria-label="expand" className="text-muted-foreground hover:text-foreground">
              {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          ) : null}
        </TableCell>
        <TableCell className="font-medium">#{item.id}</TableCell>
        <TableCell>{item.name ?? "—"}</TableCell>
        <TableCell>
          <span className={cn(lowStock && "font-semibold text-destructive")}>{item.quantity ?? 0}</span>
          {lowStock && <Badge variant="destructive" className="ml-2">Low</Badge>}
        </TableCell>
        <TableCell>{item.type ?? "—"}</TableCell>
        <TableCell><Badge variant="outline">{item.status ?? (item.isSubItems ? "Has sub-items" : "Item")}</Badge></TableCell>
        <TableCell className="text-center">
          <Switch checked={Boolean(item.isActive)} onCheckedChange={onToggle} disabled={toggling} />
        </TableCell>
        <TableCell className="text-right">
          <Link href={`/inventory/${item.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}><Eye className="h-4 w-4" /> View</Link>
        </TableCell>
      </TableRow>
      {expanded && item.isSubItems && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/30 p-0">
            <div className="p-4">
              {subQ.isLoading ? (
                <Spinner className="mx-auto h-5 w-5" />
              ) : (subQ.data?.length ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground">No sub-items.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sub-Item ID</TableHead>
                      <TableHead>Sub-Item Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Qty Avail.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(subQ.data ?? []).map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">#{s.id}</TableCell>
                        <TableCell>{s.name ?? "—"}</TableCell>
                        <TableCell>{s.description ?? "—"}</TableCell>
                        <TableCell>{s.quantity ?? 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
