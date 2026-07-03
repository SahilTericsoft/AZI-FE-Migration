import { cn } from "@/lib/cn";

/** A simple Tailwind spinner (replaces MUI CircularProgress in shadcn screens). */
export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block h-6 w-6 animate-spin rounded-full border-2 border-muted border-t-primary",
        className,
      )}
    />
  );
}
