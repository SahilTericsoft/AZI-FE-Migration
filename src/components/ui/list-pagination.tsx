"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";

/** Shared table footer: rows-per-page + range + prev/next (replaces MUI TablePagination). */
export function ListPagination({
  page,
  rowsPerPage,
  total,
  onPageChange,
  onRowsPerPageChange,
  isFetching = false,
  rowsPerPageOptions = [10, 25, 50],
}: {
  page: number; // 0-based
  rowsPerPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onRowsPerPageChange: (rows: number) => void;
  isFetching?: boolean;
  rowsPerPageOptions?: number[];
}) {
  const start = total === 0 ? 0 : page * rowsPerPage + 1;
  const end = Math.min((page + 1) * rowsPerPage, total);
  const lastPage = Math.max(0, Math.ceil(total / rowsPerPage) - 1);

  return (
    <div className="flex items-center justify-end gap-4 border-t border-border px-4 py-2 text-sm text-muted-foreground">
      {isFetching && <Spinner className="h-4 w-4" />}
      <div className="flex items-center gap-2">
        <span>Rows per page</span>
        <Select
          value={String(rowsPerPage)}
          onValueChange={(v) => onRowsPerPageChange(parseInt(v, 10))}
        >
          <SelectTrigger className="h-8 w-[72px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rowsPerPageOptions.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span>
        {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={page === 0}
          onClick={() => onPageChange(Math.max(0, page - 1))}
          aria-label="previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={page >= lastPage}
          onClick={() => onPageChange(Math.min(lastPage, page + 1))}
          aria-label="next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
