"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { ChevronRight, Plus, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { useFacilityLiteList } from "@/features/facility/facility.queries";

import {
  useDeleteLocation,
  useLocationList,
  useToggleLocation,
} from "../location.queries";
import type { Location } from "../location.types";

export default function LocationList() {
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

  const { data, isLoading, isError, error, isFetching } = useLocationList({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
  });

  const toggleLocation = useToggleLocation();
  const deleteLocation = useDeleteLocation();

  const facilities = useFacilityLiteList();
  const facilityNameById = useMemo(() => {
    const map = new Map<number, string>();
    (facilities.data ?? []).forEach((f) => map.set(f.id, f.code ?? f.name ?? `#${f.id}`));
    return map;
  }, [facilities.data]);

  const locations: Location[] = data?.docs ?? [];
  const total = data?.total ?? 0;

  const handleDelete = (location: Location) => {
    const label = location.code ?? location.name ?? `#${location.id}`;
    if (window.confirm(`Delete location "${label}"?`)) deleteLocation.mutate(location.id);
  };

  return (
    <div className="shadcn-scope flex flex-col gap-4 text-foreground">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold">Locations</h2>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search locations…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-56"
          />
          <Link href="/location/new" className={cn(buttonVariants(), "h-9 gap-1.5")}>
            <Plus className="h-4 w-4" />
            New Location
          </Link>
        </div>
      </div>

      {isError && (
        <Alert variant="destructive">{error?.message ?? "Failed to load locations."}</Alert>
      )}

      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Facility Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Active</TableHead>
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
            ) : locations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  No locations found.
                </TableCell>
              </TableRow>
            ) : (
              locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">
                    {location.code ?? location.name ?? "—"}
                  </TableCell>
                  <TableCell>{location.type ?? "—"}</TableCell>
                  <TableCell>
                    {(location.facilityId != null &&
                      facilityNameById.get(location.facilityId)) ||
                      location.facilityId ||
                      "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={location.status === "completed" ? "success" : "outline"}>
                      {location.statusObj?.title ?? location.status ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={Boolean(location.isActive)}
                      onCheckedChange={() => toggleLocation.mutate(location.id)}
                      disabled={toggleLocation.isPending || location.status === "draft"}
                      aria-label={location.status === "draft" ? "Activation disabled for draft" : "Toggle active"}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="delete"
                      onClick={() => handleDelete(location)}
                      disabled={deleteLocation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Link
                      href={`/location/${location.id}`}
                      aria-label="view"
                      className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8")}
                    >
                      <ChevronRight className="h-4 w-4" />
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
