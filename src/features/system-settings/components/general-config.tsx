"use client";

import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Read-only compliance-audit configuration (mirrors Test env — all disabled). */
const ROWS = [
  {
    label: "Audit Time Period",
    description: "Defines how often the compliance audit is evaluated.",
    selectLabel: "Select Time Period",
    value: "weekly",
    options: [{ value: "weekly", label: "Weekly" }],
  },
  {
    label: "Notification Threshold",
    description: "Sets the rejection rate percentage that triggers an alert.",
    selectLabel: "Select Cut-off",
    value: "1.5",
    options: [{ value: "1.5", label: "1.5%" }],
  },
  {
    label: "Notification Recipients",
    description: "Specifies who will receive notifications when the threshold is exceeded.",
    selectLabel: "Select Role",
    value: "superAdmin",
    options: [{ value: "superAdmin", label: "Super Admin" }],
  },
  {
    label: "Existing Patient Approval",
    description: "OTP confirmation required from selected role before adding an existing patient.",
    selectLabel: "Select Role",
    value: "facilityAdmin",
    options: [{ value: "facilityAdmin", label: "Facility Admin" }],
  },
];

export default function GeneralConfig() {
  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold">Compliance Audit Settings</h3>
        <p className="text-sm text-muted-foreground">
          Configure the compliance audit parameters that influence representation in analytics and
          trigger notifications for selected personnel.
        </p>
      </div>
      <div className="flex flex-col divide-y">
        {ROWS.map((row) => (
          <div
            key={row.label}
            className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="max-w-md">
              <div className="text-sm font-medium">{row.label}:</div>
              <div className="text-sm text-muted-foreground">{row.description}</div>
            </div>
            <div className="w-full sm:w-64">
              <Label className="sr-only">{row.selectLabel}</Label>
              <Select value={row.value} disabled>
                <SelectTrigger>
                  <SelectValue placeholder={row.selectLabel} />
                </SelectTrigger>
                <SelectContent>
                  {row.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
