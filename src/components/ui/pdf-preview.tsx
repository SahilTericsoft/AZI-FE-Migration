"use client";

import { useEffect, useState } from "react";

/**
 * Renders raw PDF bytes in an iframe. FE analogue of the legacy
 * `PdfPreviewComponent` (ArrayBuffer → Blob → object URL). The object URL is
 * revoked on unmount / when the bytes change to avoid leaks.
 */
export function PdfPreview({
  data,
  height = "70vh",
  className,
}: {
  data: ArrayBuffer;
  height?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const blob = new Blob([data], { type: "application/pdf" });
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [data]);

  if (!url) return null;

  return (
    <iframe
      src={url}
      title="PDF preview"
      className={className ?? "w-full rounded-md border border-border bg-white"}
      style={{ height }}
    />
  );
}
