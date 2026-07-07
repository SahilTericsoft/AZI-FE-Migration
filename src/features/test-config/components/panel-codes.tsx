"use client";

import { useMemo, useState } from "react";

import { Plus } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { MultiCombobox } from "@/components/ui/combobox";
import { DetailSection } from "@/components/ui/detail";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/sonner";

import {
  useCptCodeList,
  useCreateCptCode,
  useCreateIcdCode,
  useIcdCodeList,
  useUpdateTest,
} from "../test-config.queries";
import type { Test } from "../test-config.types";

/**
 * ICD / CPT billing codes for a FE "Panel" (BE `test`). Toggle whether they're
 * required, pick codes from the catalog, and add a new catalog code inline.
 */
export default function PanelCodes({ test }: { test: Test }) {
  const [icdRequired, setIcdRequired] = useState(Boolean(test.isIcdCodeRequired));
  const [cptRequired, setCptRequired] = useState(Boolean(test.isCptCodeRequired));
  const [icdSel, setIcdSel] = useState<string[]>((test.icdCodes ?? []).map(String));
  const [cptSel, setCptSel] = useState<string[]>((test.cptCodes ?? []).map(String));

  const icdList = useIcdCodeList({ limit: 200 });
  const cptList = useCptCodeList({ limit: 200 });
  const update = useUpdateTest();

  const icdOptions = useMemo(
    () =>
      (icdList.data?.docs ?? []).map((c) => ({
        value: String(c.id),
        label: c.icdCode ?? `#${c.id}`,
        sublabel: c.description ?? undefined,
      })),
    [icdList.data],
  );
  const cptOptions = useMemo(
    () =>
      (cptList.data?.docs ?? []).map((c) => ({
        value: String(c.id),
        label: c.cptCode ?? `#${c.id}`,
        sublabel: c.description ?? undefined,
      })),
    [cptList.data],
  );

  const dirty =
    icdRequired !== Boolean(test.isIcdCodeRequired) ||
    cptRequired !== Boolean(test.isCptCodeRequired) ||
    icdSel.join(",") !== (test.icdCodes ?? []).map(String).join(",") ||
    cptSel.join(",") !== (test.cptCodes ?? []).map(String).join(",");

  const save = () =>
    update.mutate(
      {
        id: test.id,
        body: {
          isIcdCodeRequired: icdRequired,
          icdCodes: icdRequired ? icdSel.map(Number) : [],
          isCptCodeRequired: cptRequired,
          cptCodes: cptRequired ? cptSel.map(Number) : [],
        },
      },
      {
        onSuccess: () => toast.success("Billing codes updated."),
        onError: (e) => toast.error(e?.message ?? "Could not update billing codes."),
      },
    );

  return (
    <div className="flex flex-col gap-6">
      <CodeSection
        kind="ICD"
        required={icdRequired}
        onRequiredChange={setIcdRequired}
        options={icdOptions}
        loading={icdList.isLoading}
        value={icdSel}
        onChange={setIcdSel}
      />
      <div className="h-px bg-border" />
      <CodeSection
        kind="CPT"
        required={cptRequired}
        onRequiredChange={setCptRequired}
        options={cptOptions}
        loading={cptList.isLoading}
        value={cptSel}
        onChange={setCptSel}
      />

      {update.isError && (
        <Alert variant="destructive">{update.error?.message ?? "Failed to save."}</Alert>
      )}
      <div>
        <Button onClick={save} disabled={!dirty || update.isPending} className="gap-1.5">
          {update.isPending && <Spinner className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

function CodeSection({
  kind,
  required,
  onRequiredChange,
  options,
  loading,
  value,
  onChange,
}: {
  kind: "ICD" | "CPT";
  required: boolean;
  onRequiredChange: (v: boolean) => void;
  options: { value: string; label: string; sublabel?: string }[];
  loading?: boolean;
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <DetailSection title={`${kind} Codes`}>
      <div className="col-span-full flex flex-col gap-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={required} onCheckedChange={onRequiredChange} />
          {kind} codes required for this panel
        </label>
        {required && (
          <>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <MultiCombobox
                  options={options}
                  value={value}
                  onChange={onChange}
                  loading={loading}
                  placeholder={options.length === 0 ? `No ${kind} codes yet` : `Select ${kind} codes`}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="h-4 w-4" /> New
              </Button>
            </div>
          </>
        )}
      </div>
      {dialogOpen && (
        <NewCodeDialog
          kind={kind}
          onClose={() => setDialogOpen(false)}
          onCreated={(id) => {
            onChange([...value, String(id)]);
            setDialogOpen(false);
          }}
        />
      )}
    </DetailSection>
  );
}

function NewCodeDialog({
  kind,
  onClose,
  onCreated,
}: {
  kind: "ICD" | "CPT";
  onClose: () => void;
  onCreated: (id: number) => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const createIcd = useCreateIcdCode();
  const createCpt = useCreateCptCode();
  const busy = createIcd.isPending || createCpt.isPending;

  const submit = () => {
    const body =
      kind === "ICD"
        ? { icdCode: code.trim(), description: description.trim() || undefined }
        : { cptCode: code.trim(), description: description.trim() || undefined };
    const mut = kind === "ICD" ? createIcd : createCpt;
    mut.mutate(body, {
      onSuccess: (created) => {
        toast.success(`${kind} code created.`);
        onCreated(created.id);
      },
      onError: (e) => toast.error(e?.message ?? `Could not create ${kind} code.`),
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !busy && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New {kind} Code</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-1">
          <div className="space-y-1.5">
            <Label>
              {kind} Code <span className="text-destructive">*</span>
            </Label>
            <Input value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={code.trim() === "" || busy} className="gap-1.5">
            {busy && <Spinner className="h-4 w-4" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
