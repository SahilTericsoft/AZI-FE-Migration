"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus, Trash2 } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/sonner";

import { testConfigApi } from "../test-config.api";
import {
  useAddBiomarkerConfig,
  useAgeList,
  useBiomarkerConfigs,
  useDeleteBiomarkerConfig,
  useEditBiomarkerConfig,
  useExpressions,
  useGenderOptions,
} from "../test-config.queries";
import type { BiomarkerConfigRule } from "../test-config.types";

interface ConfigDraft {
  key: string;
  id?: number;
  gender: string;
  age: string;
  rules: BiomarkerConfigRule[];
  expectedResults: string;
  isBiomarkerNoteAvailable: boolean;
  biomarkerNotes: string;
  isEditMode: boolean;
}

const blankRule = (): BiomarkerConfigRule => ({
  value1: "",
  value2: "",
  expression: "",
  units: "",
  result: "",
  color: "#e8d5c7",
});

const blankDraft = (): ConfigDraft => ({
  key: Math.random().toString(36).slice(2),
  gender: "",
  age: "",
  rules: [blankRule()],
  expectedResults: "",
  isBiomarkerNoteAvailable: false,
  biomarkerNotes: "",
  isEditMode: true,
});

/**
 * Report Configuration builder (legacy BiomarkersReportConfigAdd). A biomarker can
 * carry many reference-range configs keyed by gender+age; each config maps a
 * measured value to a result through comparison rules. Qualitative configs add a
 * result label + display colour and an expected result.
 */
export default function BiomarkerConfigStep({
  biomarkerId,
  reportFormat,
  onDone,
}: {
  biomarkerId: number;
  reportFormat: string;
  onDone: () => void;
}) {
  const isQualitative = reportFormat === "Qualitative";
  const { data: existing } = useBiomarkerConfigs(biomarkerId);
  const genderQ = useGenderOptions();
  const ageQ = useAgeList();
  const exprQ = useExpressions();
  const addConfig = useAddBiomarkerConfig(biomarkerId);
  const editConfig = useEditBiomarkerConfig(biomarkerId);
  const delConfig = useDeleteBiomarkerConfig(biomarkerId);

  const [required, setRequired] = useState<"yes" | "no" | null>(null);
  const [configs, setConfigs] = useState<ConfigDraft[]>([blankDraft()]);
  const [busy, setBusy] = useState(false);

  // Hydrate from any saved configs.
  useEffect(() => {
    if (existing && existing.length > 0) {
      setRequired("yes");
      setConfigs(
        existing.map((c) => ({
          key: String(c.id),
          id: c.id,
          gender: c.gender ?? "",
          age: c.age ?? "",
          rules: c.rules && c.rules.length > 0 ? c.rules : [blankRule()],
          expectedResults: c.expectedResults ?? "",
          isBiomarkerNoteAvailable: Boolean(c.isBiomarkerNoteAvailable),
          biomarkerNotes: c.biomarkerNotes ?? "",
          isEditMode: false,
        })),
      );
    }
  }, [existing]);

  const genderOptions = useMemo(() => {
    const base = (genderQ.data ?? []).map((g) => ({ title: g.title, code: String(g.code) }));
    return [...base, { title: "All", code: "all" }];
  }, [genderQ.data]);

  const update = (idx: number, patch: Partial<ConfigDraft>) =>
    setConfigs((cs) => cs.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const updateRule = (cIdx: number, rIdx: number, patch: Partial<BiomarkerConfigRule>) =>
    setConfigs((cs) =>
      cs.map((c, i) =>
        i === cIdx
          ? { ...c, rules: c.rules.map((r, j) => (j === rIdx ? { ...r, ...patch } : r)) }
          : c,
      ),
    );

  const ruleValid = (r: BiomarkerConfigRule) =>
    Boolean(r.expression) &&
    (r.expression !== "-" || (r.value1 ?? "") !== "") &&
    (r.value2 ?? "") !== "" &&
    (r.units ?? "") !== "" &&
    (!isQualitative || (Boolean(r.result) && Boolean(r.color)));

  const configValid = (c: ConfigDraft) =>
    Boolean(c.gender) &&
    Boolean(c.age) &&
    c.rules.length > 0 &&
    c.rules.every(ruleValid) &&
    (!isQualitative || c.expectedResults.trim() !== "") &&
    (!c.isBiomarkerNoteAvailable || c.biomarkerNotes.trim() !== "");

  const saveConfig = async (idx: number) => {
    const c = configs[idx];
    if (!configValid(c)) return;
    const body: Record<string, unknown> = {
      gender: c.gender,
      age: c.age,
      rules: c.rules,
      isBiomarkerNoteAvailable: c.isBiomarkerNoteAvailable,
      biomarkerNotes: c.isBiomarkerNoteAvailable ? c.biomarkerNotes : null,
      ...(isQualitative ? { expectedResults: c.expectedResults } : {}),
    };
    try {
      if (c.id) {
        await editConfig.mutateAsync({ id: c.id, body });
        update(idx, { isEditMode: false });
      } else {
        const saved = await addConfig.mutateAsync(body);
        update(idx, { id: saved.id, isEditMode: false });
      }
      toast.success("Configuration saved.");
    } catch {
      toast.error("Could not save configuration.");
    }
  };

  const removeConfig = async (idx: number) => {
    const c = configs[idx];
    if (c.id) {
      if (!window.confirm("Remove this configuration?")) return;
      try {
        await delConfig.mutateAsync(c.id);
      } catch {
        toast.error("Could not remove configuration.");
        return;
      }
    }
    setConfigs((cs) => cs.filter((_, i) => i !== idx));
  };

  const finish = async () => {
    setBusy(true);
    try {
      await testConfigApi.biomarkers.update(biomarkerId, {
        isConfigurationRequired: required === "yes",
      });
      onDone();
    } catch {
      toast.error("Could not update the test.");
    } finally {
      setBusy(false);
    }
  };

  const allSaved = configs.every((c) => c.id && !c.isEditMode);
  const nextDisabled = required === "yes" ? !allSaved || configs.length === 0 : required == null;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Selected report format: <span className="font-medium text-foreground">{reportFormat || "—"}</span>
      </p>

      <div className="flex items-center gap-4">
        <Label>Is Configuration required?</Label>
        <RadioGroup
          className="flex gap-6"
          value={required ?? ""}
          onValueChange={(v) => setRequired(v as "yes" | "no")}
        >
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="yes" /> Yes</label>
          <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="no" /> No</label>
        </RadioGroup>
      </div>

      {required === "yes" && (
        <Accordion type="single" collapsible className="flex flex-col gap-3">
          {configs.map((c, idx) => (
            <AccordionItem
              key={c.key}
              value={c.key}
              className="rounded-md border border-border px-3"
            >
              <AccordionTrigger>
                Configuration {idx + 1}
                {c.id && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Gender: {c.gender} | Age: {c.age})
                  </span>
                )}
              </AccordionTrigger>
              <AccordionContent>
                {c.id && !c.isEditMode ? (
                  <ConfigView
                    config={c}
                    isQualitative={isQualitative}
                    onEdit={() => update(idx, { isEditMode: true })}
                    onRemove={configs.length > 1 ? () => removeConfig(idx) : undefined}
                  />
                ) : (
                  <div className="flex flex-col gap-4 py-2">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Gender *</Label>
                        <Select value={c.gender} onValueChange={(v) => update(idx, { gender: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger>
                          <SelectContent>
                            {genderOptions.map((g) => (
                              <SelectItem key={g.code} value={g.code}>{g.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Age *</Label>
                        <Select value={c.age} onValueChange={(v) => update(idx, { age: v })}>
                          <SelectTrigger><SelectValue placeholder="Select Age" /></SelectTrigger>
                          <SelectContent>
                            {(ageQ.data ?? []).map((a) => (
                              <SelectItem key={String(a.code)} value={String(a.code)}>{a.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      {c.rules.map((r, rIdx) => (
                        <div key={rIdx} className="rounded-md border border-border p-3">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                            <div className="space-y-1.5">
                              <Label>Value {r.expression === "-" ? "*" : ""}</Label>
                              <Input
                                type="number"
                                value={r.value1 ?? ""}
                                disabled={r.expression !== "-"}
                                onChange={(e) => updateRule(idx, rIdx, { value1: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Expression *</Label>
                              <Select
                                value={r.expression ?? ""}
                                onValueChange={(v) =>
                                  updateRule(idx, rIdx, { expression: v, ...(v !== "-" ? { value1: "" } : {}) })
                                }
                              >
                                <SelectTrigger><SelectValue placeholder="Expression" /></SelectTrigger>
                                <SelectContent>
                                  {(exprQ.data ?? []).map((ex) => (
                                    <SelectItem key={String(ex.code)} value={String(ex.code)}>{ex.title}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1.5">
                              <Label>Value *</Label>
                              <Input
                                type="number"
                                value={r.value2 ?? ""}
                                onChange={(e) => updateRule(idx, rIdx, { value2: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Units *</Label>
                              <Input
                                value={r.units ?? ""}
                                onChange={(e) => updateRule(idx, rIdx, { units: e.target.value })}
                              />
                            </div>
                            {isQualitative && (
                              <>
                                <div className="space-y-1.5">
                                  <Label>Result *</Label>
                                  <Input
                                    value={r.result ?? ""}
                                    onChange={(e) => updateRule(idx, rIdx, { result: e.target.value })}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label>Colour *</Label>
                                  <Input
                                    type="color"
                                    className="h-9 w-16 p-1"
                                    value={r.color ?? "#e8d5c7"}
                                    onChange={(e) => updateRule(idx, rIdx, { color: e.target.value })}
                                  />
                                </div>
                              </>
                            )}
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                disabled={c.rules.length === 1}
                                onClick={() =>
                                  update(idx, { rules: c.rules.filter((_, j) => j !== rIdx) })
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-fit gap-1.5"
                        onClick={() => update(idx, { rules: [...c.rules, blankRule()] })}
                      >
                        <Plus className="h-4 w-4" /> Add Another Value
                      </Button>
                    </div>

                    {isQualitative && (
                      <div className="space-y-1.5">
                        <Label>Expected Result *</Label>
                        <Input
                          value={c.expectedResults}
                          onChange={(e) => update(idx, { expectedResults: e.target.value })}
                        />
                      </div>
                    )}

                    <label className="flex items-center gap-2 text-sm">
                      <Switch
                        checked={c.isBiomarkerNoteAvailable}
                        onCheckedChange={(v) => update(idx, { isBiomarkerNoteAvailable: v })}
                      />
                      Test Note
                    </label>
                    {c.isBiomarkerNoteAvailable && (
                      <div className="space-y-1.5">
                        <Label>Test Note *</Label>
                        <Textarea
                          value={c.biomarkerNotes}
                          onChange={(e) => update(idx, { biomarkerNotes: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => saveConfig(idx)}
                        disabled={!configValid(c) || addConfig.isPending || editConfig.isPending}
                        className="gap-1.5"
                      >
                        {(addConfig.isPending || editConfig.isPending) && <Spinner className="h-4 w-4" />}
                        Save
                      </Button>
                      {configs.length > 1 && (
                        <Button type="button" variant="outline" onClick={() => removeConfig(idx)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {required === "yes" && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-fit gap-1.5"
          disabled={!configs.every((c) => c.id && !c.isEditMode)}
          onClick={() => setConfigs((cs) => [...cs, blankDraft()])}
        >
          <Plus className="h-4 w-4" /> Add More
        </Button>
      )}

      <div className="flex justify-end border-t border-border pt-4">
        <Button onClick={finish} disabled={nextDisabled || busy} className="min-w-[130px] gap-1.5">
          {busy && <Spinner className="h-4 w-4" />}
          {busy ? "Saving…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}

function ConfigView({
  config,
  isQualitative,
  onEdit,
  onRemove,
}: {
  config: ConfigDraft;
  isQualitative: boolean;
  onEdit: () => void;
  onRemove?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Gender:</span> {config.gender}</div>
        <div><span className="text-muted-foreground">Age:</span> {config.age}</div>
      </div>
      <div className="flex flex-col gap-1.5">
        {config.rules.map((r, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            {isQualitative && r.color && (
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
            )}
            <span>
              {r.expression === "-" ? `${r.value1} – ${r.value2}` : `${r.expression} ${r.value2}`} {r.units}
              {isQualitative && r.result ? ` → ${r.result}` : ""}
            </span>
          </div>
        ))}
      </div>
      {isQualitative && config.expectedResults && (
        <div className="text-sm"><span className="text-muted-foreground">Expected Result:</span> {config.expectedResults}</div>
      )}
      {config.isBiomarkerNoteAvailable && config.biomarkerNotes && (
        <div className="text-sm"><span className="text-muted-foreground">Test Note:</span> {config.biomarkerNotes}</div>
      )}
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onEdit}>Edit</Button>
        {onRemove && (
          <Button type="button" size="sm" variant="outline" className="text-destructive" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}
