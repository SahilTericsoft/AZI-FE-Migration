import { Check } from "lucide-react";

import { cn } from "@/lib/cn";

/** Horizontal stepper (replaces MUI Stepper). `activeStep` is 0-based. */
export function Stepper({ steps, activeStep }: { steps: string[]; activeStep: number }) {
  return (
    <ol className="flex w-full items-center">
      {steps.map((label, i) => {
        const done = i < activeStep;
        const active = i === activeStep;
        return (
          <li
            key={label}
            className={cn("flex items-center", i < steps.length - 1 && "flex-1")}
          >
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-full text-sm font-semibold transition-colors",
                  done && "bg-primary text-primary-foreground",
                  active && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  !done && !active && "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={cn(
                  "whitespace-nowrap text-xs font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn("mx-2 h-0.5 flex-1", done ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
