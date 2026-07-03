"use client";

import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  toLogArray,
  useActivityLogs,
} from "@/features/activity-log/activity-log.queries";
import type { ActivityLog } from "@/features/activity-log/activity-log.types";

function capitalize(s?: string | null) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function logLine(log: ActivityLog): string {
  return [capitalize(log.module), log.field, log.value].filter(Boolean).join(" > ");
}

function logWhen(log: ActivityLog): string {
  const raw = log.logDateTime || log.createdAt;
  if (!raw) return "";
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? raw : d.toLocaleString();
}

export default function ActivityLogsTab({ patientId }: { patientId: number }) {
  const { data, isLoading } = useActivityLogs({
    identityId: patientId,
    module: "patient",
    limit: 100,
  });
  const logs = toLogArray(data);

  if (isLoading) {
    return (
      <div className="grid place-items-center py-12">
        <Spinner />
      </div>
    );
  }

  if (logs.length === 0) {
    return <p className="py-4 text-muted-foreground">No activity logged for this patient.</p>;
  }

  return (
    <div className="flex flex-col gap-1">
      {logs.map((log) => (
        <div
          key={log.id}
          className="flex items-center justify-between gap-2 rounded-md bg-muted px-3 py-2.5"
        >
          <p className="text-sm">
            {logLine(log) || "—"}
            {log.userId ? (
              <span className="text-muted-foreground"> · by user #{log.userId}</span>
            ) : null}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {log.action && <Badge variant="success">{log.action}</Badge>}
            <span className="text-xs text-muted-foreground">{logWhen(log)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
