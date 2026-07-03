"use client";

import { Toaster as SonnerToaster } from "sonner";

export { toast } from "sonner";

/** App toaster (replaces MUI Snackbar). Mounted once in Providers. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "shadcn-scope rounded-md border border-border bg-card text-card-foreground shadow-md",
          description: "text-muted-foreground",
        },
      }}
    />
  );
}
