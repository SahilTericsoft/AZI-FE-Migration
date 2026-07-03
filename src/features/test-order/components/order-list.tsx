"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Eye, Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ListPagination } from "@/components/ui/list-pagination";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import { humanizeKey } from "@/lib/format";

import { useOrderList } from "../test-order.queries";
import type { Order } from "../test-order.types";

function statusVariant(status: string | null) {
  const s = (status ?? "").toLowerCase();
  if (s === "completed") return "success" as const;
  if (s === "draft") return "secondary" as const;
  return "default" as const;
}

function PatientCell({ order }: { order: Order }) {
  const pd = (order.patientDetails ?? undefined) as Record<string, unknown> | undefined;
  if (!pd) return <>—</>;
  const name = [pd.firstName, pd.lastName].filter(Boolean).join(" ");
  const gender = pd.gender ? `(${String(pd.gender).charAt(0).toUpperCase()}) ` : "";
  const dob = (pd.dateOfBirth as string) ?? "";
  return (
    <div>
      <p className="capitalize">{name || "—"}</p>
      <p className="text-xs text-muted-foreground">
        {gender}
        {dob}
      </p>
    </div>
  );
}

export default function OrderList() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError, error, isFetching } = useOrderList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const orders: Order[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Test Order</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by Order ID or Patient Name…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-72"
          />
          <Link href="/test-order/new" className={cn(buttonVariants(), "h-9 gap-1.5 whitespace-nowrap")}>
            <Plus className="h-4 w-4" />
            New Test Order
          </Link>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load orders."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Ordered Tests/Panel</TableHead>
              <TableHead>Ordered Date &amp; Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.code ?? `#${order.id}`}</TableCell>
                  <TableCell>
                    <PatientCell order={order} />
                  </TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>
                    {order.orderPlacedTime ??
                      (order.createdAt ? order.createdAt.slice(0, 10) : "—")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)}>
                      {order.status ? humanizeKey(order.status) : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/test-order/${order.id}`}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
                    >
                      <Eye className="h-4 w-4" />
                      View
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
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </Card>
    </div>
  );
}
