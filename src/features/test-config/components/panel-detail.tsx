"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MultiCombobox } from "@/components/ui/combobox";
import { DetailField, DetailSection } from "@/components/ui/detail";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/datetime";
import { humanizeKey } from "@/lib/format";

import {
  useBiomarkerOptions,
  useDeletePanel,
  usePanel,
  useTestOptions,
  useTogglePanel,
  useUpdatePanel,
} from "../test-config.queries";
import type { Panel } from "../test-config.types";
import AssignLabCard from "./assign-lab-card";

const SAMPLE_TYPES = ["Blood", "Serum", "Plasma", "Urine", "Saliva", "Swab", "Tissue", "Stool"];

export default function PanelDetail({ panelId }: { panelId: number }) {
  const router = useRouter();
  const { data: panel, isLoading, isError } = usePanel(panelId);
  const toggle = useTogglePanel();
  const del = useDeletePanel();
  const [editOpen, setEditOpen] = useState(false);

  const { data: testOptions = [] } = useTestOptions();
  const { data: biomarkerOptions = [] } = useBiomarkerOptions();

  const testName = useMemo(() => {
    const m = new Map<number, string>();
    testOptions.forEach((t) => m.set(t.id, t.name ?? t.code ?? `#${t.id}`));
    return m;
  }, [testOptions]);
  const biomarkerName = useMemo(() => {
    const m = new Map<number, string>();
    biomarkerOptions.forEach((b) => m.set(b.id, b.name ?? b.code ?? `#${b.id}`));
    return m;
  }, [biomarkerOptions]);

  if (isLoading) {
    return (
      <div className="shadcn-scope grid min-h-[50dvh] place-items-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !panel) {
    return (
      <div className="shadcn-scope flex flex-col items-start gap-3 text-foreground">
        <Link
          href="/test-configuration?active-tab=profile"
          className={cn(buttonVariants({ variant: "ghost" }), "gap-1.5")}
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="text-muted-foreground">Profile not found.</p>
      </div>
    );
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete profile "${panel.name ?? panel.code ?? panel.id}"?`)) return;
    del.mutate(panel.id, {
      onSuccess: () => {
        toast.success("Profile deleted.");
        router.push("/test-configuration?active-tab=profile");
      },
      onError: (e) => toast.error(e?.message ?? "Could not delete profile."),
    });
  };

  return (
    <div className="shadcn-scope flex flex-col gap-3 text-foreground">
      <Link
        href="/test-configuration?active-tab=profile"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5")}
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <Card className="p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{panel.name ?? `Profile #${panel.id}`}</h2>
              {panel.status && <Badge variant="outline">{humanizeKey(panel.status)}</Badge>}
              <Badge variant={panel.isActive ? "success" : "outline"}>
                {panel.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
              <DetailField label="Profile ID" value={panel.code ?? `#${panel.id}`} />
              <DetailField label="Sample Type" value={panel.sampleType} />
              <DetailField label="Panel(s)" value={panel.testIds?.length ?? 0} />
              <DetailField
                label="Created On"
                value={panel.createdAt ? formatDateTime(panel.createdAt) : undefined}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 self-start">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={Boolean(panel.isActive)}
                onCheckedChange={() => toggle.mutate(panel.id)}
                disabled={toggle.isPending}
              />{" "}
              Active
            </label>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" /> Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive"
              onClick={handleDelete}
              disabled={del.isPending}
            >
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-0">
        <Tabs defaultValue="details">
          <TabsList className="w-full px-2">
            <TabsTrigger value="details">Basic Details</TabsTrigger>
            <TabsTrigger value="labs">Assigned Labs</TabsTrigger>
          </TabsList>
          <div className="p-6">
            <TabsContent value="details" className="mt-0">
              <DetailSection title="Basic Details">
                <DetailField label="Profile Name" value={panel.name} />
                <DetailField label="Profile Code" value={panel.code} />
                <DetailField label="Sample Type" value={panel.sampleType} />
                <DetailField label="Description" value={panel.description} />
                <DetailField
                  label="Ordering Limit"
                  value={
                    panel.hasOrderingLimit
                      ? `Alert ${panel.alertLimit ?? "—"} / Max ${panel.maxLimit ?? "—"}`
                      : "None"
                  }
                />
              </DetailSection>

              <DetailSection title="Panels & Tests">
                <div className="col-span-full flex flex-col gap-3">
                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">Panel(s)</p>
                    <div className="flex flex-wrap gap-2">
                      {panel.testIds && panel.testIds.length > 0 ? (
                        panel.testIds.map((id) => (
                          <Badge key={id} variant="secondary">
                            {testName.get(id) ?? `#${id}`}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs text-muted-foreground">Test(s)</p>
                    <div className="flex flex-wrap gap-2">
                      {panel.biomarkerIds && panel.biomarkerIds.length > 0 ? (
                        panel.biomarkerIds.map((id) => (
                          <Badge key={id} variant="secondary">
                            {biomarkerName.get(id) ?? `#${id}`}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">None</span>
                      )}
                    </div>
                  </div>
                </div>
              </DetailSection>
            </TabsContent>
            <TabsContent value="labs" className="mt-0">
              <AssignLabCard kind="panels" entityId={panel.id} />
            </TabsContent>
          </div>
        </Tabs>
      </Card>

      {editOpen && <EditPanelDialog panel={panel} onClose={() => setEditOpen(false)} />}
    </div>
  );
}

function EditPanelDialog({ panel, onClose }: { panel: Panel; onClose: () => void }) {
  const [name, setName] = useState(panel.name ?? "");
  const [code, setCode] = useState(panel.code ?? "");
  const [sampleType, setSampleType] = useState(panel.sampleType ?? "");
  const [description, setDescription] = useState(panel.description ?? "");
  const [testIds, setTestIds] = useState<string[]>((panel.testIds ?? []).map(String));
  const [biomarkerIds, setBiomarkerIds] = useState<string[]>(
    (panel.biomarkerIds ?? []).map(String),
  );
  const [hasOrderingLimit, setHasOrderingLimit] = useState<"yes" | "no">(
    panel.hasOrderingLimit ? "yes" : "no",
  );
  const [alertLimit, setAlertLimit] = useState(
    panel.alertLimit != null ? String(panel.alertLimit) : "",
  );
  const [maxLimit, setMaxLimit] = useState(panel.maxLimit != null ? String(panel.maxLimit) : "");
  const [limitError, setLimitError] = useState<string | null>(null);

  const update = useUpdatePanel();
  const { data: testOptions = [] } = useTestOptions();
  const { data: biomarkerOptions = [] } = useBiomarkerOptions();

  const limitsValid =
    hasOrderingLimit === "no" ||
    (/^\d+$/.test(alertLimit) &&
      /^\d+$/.test(maxLimit) &&
      Number(maxLimit) >= 1 &&
      Number(maxLimit) <= 10 &&
      Number(alertLimit) >= 1 &&
      Number(alertLimit) <= Number(maxLimit));

  const valid = useMemo(
    () => name.trim() !== "" && code.trim() !== "" && limitsValid,
    [name, code, limitsValid],
  );

  const submit = () => {
    setLimitError(null);
    if (hasOrderingLimit === "yes" && !limitsValid) {
      setLimitError("Alert & Max limit must be 1–10, and Alert Limit cannot exceed Max Limit.");
      return;
    }
    update.mutate(
      {
        id: panel.id,
        body: {
          name: name.trim(),
          code: code.trim(),
          sampleType: sampleType || null,
          description: description.trim() || null,
          testIds: testIds.map(Number),
          biomarkerIds: biomarkerIds.map(Number),
          hasOrderingLimit: hasOrderingLimit === "yes",
          ...(hasOrderingLimit === "yes"
            ? { alertLimit: Number(alertLimit), maxLimit: Number(maxLimit) }
            : { alertLimit: null, maxLimit: null }),
        },
      },
      {
        onSuccess: () => {
          toast.success("Profile updated.");
          onClose();
        },
      },
    );
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !update.isPending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto py-1">
          <div className="space-y-1.5">
            <Label htmlFor="panel-name">Profile Name</Label>
            <Input id="panel-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panel-code">Profile Code</Label>
            <Input id="panel-code" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Sample Type</Label>
            <Select value={sampleType} onValueChange={setSampleType}>
              <SelectTrigger>
                <SelectValue placeholder="Select sample type" />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Panel(s)</Label>
            <MultiCombobox
              options={testOptions.map((t) => ({
                value: String(t.id),
                label: t.name ?? `#${t.id}`,
                sublabel: t.code ?? undefined,
              }))}
              value={testIds}
              onChange={setTestIds}
              placeholder={testOptions.length === 0 ? "No active panels" : "Select panels"}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Test(s)</Label>
            <MultiCombobox
              options={biomarkerOptions.map((b) => ({
                value: String(b.id),
                label: b.name ?? `#${b.id}`,
                sublabel: b.code ?? undefined,
              }))}
              value={biomarkerIds}
              onChange={setBiomarkerIds}
              placeholder={biomarkerOptions.length === 0 ? "No active tests" : "Select tests"}
            />
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <Label>Is there any ordering limit?</Label>
            <RadioGroup
              className="flex gap-6"
              value={hasOrderingLimit}
              onValueChange={(v) => setHasOrderingLimit(v as "yes" | "no")}
            >
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="yes" /> Yes
              </label>
              <label className="flex items-center gap-2 text-sm">
                <RadioGroupItem value="no" /> No
              </label>
            </RadioGroup>
            {hasOrderingLimit === "yes" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="alert-limit">
                    Alert Limit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="alert-limit"
                    inputMode="numeric"
                    value={alertLimit}
                    onChange={(e) => setAlertLimit(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max-limit">
                    Max Limit <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="max-limit"
                    inputMode="numeric"
                    value={maxLimit}
                    onChange={(e) => setMaxLimit(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  />
                </div>
              </div>
            )}
            {limitError && <Alert variant="destructive">{limitError}</Alert>}
          </div>
          {update.isError && (
            <Alert variant="destructive">{update.error?.message ?? "Failed to update profile."}</Alert>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!valid || update.isPending} className="gap-1.5">
            {update.isPending && <Spinner className="h-4 w-4" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
