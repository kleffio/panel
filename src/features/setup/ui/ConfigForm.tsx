"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from "@kleffio/ui";
import type { ConfigField } from "@/features/setup/model/types";

function ConfigFieldRow({
  field,
  values,
  onChange,
}: {
  field: ConfigField;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.key}>
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </Label>
      {field.type === "select" && field.options ? (
        <Select
          value={values[field.key] ?? ""}
          onValueChange={(v) => onChange(field.key, v)}
        >
          <SelectTrigger id={field.key} className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "boolean" ? (
        <Switch
          id={field.key}
          checked={values[field.key] === "true"}
          onCheckedChange={(c) => onChange(field.key, c ? "true" : "false")}
        />
      ) : (
        <Input
          id={field.key}
          type={field.type === "secret" ? "password" : "text"}
          required={field.required}
          placeholder={field.default}
          value={values[field.key] ?? ""}
          onChange={(e) => onChange(field.key, e.target.value)}
        />
      )}
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

interface ConfigFormProps {
  fields: ConfigField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}

export function ConfigForm({ fields, values, onChange }: ConfigFormProps) {
  const [advancedMode, setAdvancedMode] = useState(false);
  const normalFields = fields.filter((f) => !f.advanced);
  const advancedFields = fields.filter((f) => f.advanced);
  const hasAdvancedFields = advancedFields.length > 0;

  return (
    <>
      {normalFields.map((field) => (
        <ConfigFieldRow key={field.key} field={field} values={values} onChange={onChange} />
      ))}

      {hasAdvancedFields && (
        <div className="space-y-4 pt-1">
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-fit"
            onClick={() => setAdvancedMode((v) => !v)}
          >
            <ChevronDown
              className={`size-3.5 transition-transform ${advancedMode ? "rotate-180" : ""}`}
            />
            {advancedMode ? "Hide advanced settings" : "Show advanced settings"}
          </button>

          {advancedMode && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {advancedFields.map((field) => (
                <ConfigFieldRow key={field.key} field={field} values={values} onChange={onChange} />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
