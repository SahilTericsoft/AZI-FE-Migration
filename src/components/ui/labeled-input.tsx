import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

/**
 * A labelled input with optional error/hint. Defined at module scope (stable
 * identity) so the underlying <input> never remounts between renders — defining
 * such a field component *inside* another component is the classic cause of the
 * "type one character, lose focus" bug.
 */
export function LabeledInput({
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  required,
  type,
  inputMode,
  readOnly,
  placeholder,
  id,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  inputMode?: "numeric" | "text";
  readOnly?: boolean;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      <Input
        id={id}
        type={type}
        inputMode={inputMode}
        value={value}
        readOnly={readOnly}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        className={cn(readOnly && "bg-muted")}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
