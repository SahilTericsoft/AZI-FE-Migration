"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { cn } from "@/lib/cn";
import { humanizeKey } from "@/lib/format";

import { useTestList, useToggleTest } from "../test-config.queries";
import type { Test } from "../test-config.types";

export default function TestTab() {
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

  const { data, isLoading, isError, error, isFetching } = useTestList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const toggle = useToggleTest();
  const tests: Test[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          placeholder="Search Test…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="h-9 w-64"
        />
        <Link href="/test-configuration/test/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
          <Plus className="h-4 w-4" /> New Test
        </Link>
      </div>

      {isError && <Alert variant="destructive">{error?.message ?? "Failed to load tests."}</Alert>}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Test ID</TableHead>
              <TableHead>Test Name</TableHead>
              <TableHead>Sample Type</TableHead>
              <TableHead>Test Status</TableHead>
              <TableHead className="text-right">Active/Inactive</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center">
                  <Spinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : tests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  No tests found.
                </TableCell>
              </TableRow>
            ) : (
              tests.map((test) => (
                <TableRow key={test.id}>
                  <TableCell className="font-medium">{test.code ?? `#${test.id}`}</TableCell>
                  <TableCell>{test.name ?? "—"}</TableCell>
                  <TableCell>{test.sampleType ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{test.status ? humanizeKey(test.status) : "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-2">
                      <Badge variant={test.isActive ? "success" : "outline"}>
                        {test.isActive ? "Active" : "Inactive"}
                      </Badge>
                      <Switch
                        checked={Boolean(test.isActive)}
                        disabled={toggle.isPending}
                        onCheckedChange={() => toggle.mutate(test.id)}
                      />
                    </span>
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
