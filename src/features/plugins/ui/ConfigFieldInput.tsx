"use client";

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
import type { ConfigField } from "@/lib/api/plugins";

interface ConfigFieldInputProps {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
}

export function ConfigFieldInput({ field, value, onChange }: ConfigFieldInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={field.key} className="text-sm">
        {field.label}
        {field.required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>

      {field.type === "select" ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger id={field.key} className="w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "boolean" ? (
        <Switch
          id={field.key}
          checked={value === "true"}
          onCheckedChange={(c) => onChange(c ? "true" : "false")}
        />
      ) : (
        <Input
          id={field.key}
          type={
            field.type === "secret"
              ? "password"
              : field.type === "number"
              ? "number"
              : "text"
          }
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.default ?? ""}
          className="h-9 text-sm"
        />
      )}

      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}
