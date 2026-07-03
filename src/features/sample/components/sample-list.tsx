"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Flag, SquareArrowOutUpRight } from "lucide-react";

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

import { useSampleList } from "../sample.queries";
import type { Sample } from "../sample.types";

function orderCode(sample: Sample) {
  const od = sample.orderDetails as { code?: string } | undefined;
  return od?.code ?? (sample.orderId != null ? `#${sample.orderId}` : "—");
}

export default function SampleList() {
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

  const { data, isLoading, isError, error, isFetching } = useSampleList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const samples: Sample[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Sample</h2>
        <Input
          placeholder="Search by Accession ID…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 w-64"
        />
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load samples."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Accession ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Tracking ID</TableHead>
              <TableHead>Received Timestamp</TableHead>
              <TableHead>Sample Status</TableHead>
              <TableHead>Result</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : samples.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-muted-foreground">
                  No samples found.
                </TableCell>
              </TableRow>
            ) : (
              samples.map((sample) => (
                <TableRow key={sample.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-1">
                      {sample.isPriorityOrder && (
                        <Flag className="h-4 w-4 text-destructive" />
                      )}
                      {sample.sampleCode ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>{orderCode(sample)}</TableCell>
                  <TableCell>{sample.barcode ?? "N/A"}</TableCell>
                  <TableCell>
                    {sample.accessionedDate ??
                      (sample.createdAt ? sample.createdAt.slice(0, 10) : "N/A")}
                  </TableCell>
                  <TableCell>
                    <Badge variant={sample.status === "completed" ? "success" : "outline"}>
                      {sample.status ? humanizeKey(sample.status) : "—"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {sample.isPdfGenerated ? <Badge variant="secondary">PDF</Badge> : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {sample.orderId != null && (
                      <Link
                        href={`/test-order/${sample.orderId}`}
                        aria-label="open order"
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                      >
                        <SquareArrowOutUpRight className="h-4 w-4" />
                      </Link>
                    )}
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
