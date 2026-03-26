"use client";

import * as React from "react";
import { Building2, Save, Cpu, HardDrive, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { updateOrgSettings } from "@/features/admin/server/actions";
import type { OrgSettingsData } from "@/features/admin/server/loaders";

export function AdminDashboard({ initialData }: { initialData: OrgSettingsData }) {
  const [name, setName] = React.useState(initialData.orgName);
  const [ramLimit, setRamLimit] = React.useState(initialData.ramLimit);
  const [isPending, setIsPending] = React.useState(false);

  const handleSave = async () => {
    setIsPending(true);
    try {
      const res = await updateOrgSettings({ orgName: name, ramLimit });
      if (res.success) {
        toast.success(res.message);
      }
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500 text-[var(--test-foreground)]">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Organization Settings</h1>
        <p className="mt-2 text-sm text-[var(--test-muted)]">Manage your organization's resources, billing, and team limits.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* General Settings */}
        <div className="rounded-[1.5rem] border border-[var(--test-border)] bg-[var(--test-panel)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--test-panel-soft)] text-[var(--test-foreground)] border border-[var(--test-border)]">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-xl">General</h2>
              <p className="text-sm text-[var(--test-muted)] mt-0.5">Basic organization details</p>
            </div>
          </div>
          
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium text-[var(--test-muted)] mb-1 block">Organization Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-[var(--test-border)] bg-[var(--test-panel-muted)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--test-accent)]"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-[var(--test-muted)] mb-1 block">Billing Email</label>
              <input
                type="email"
                readOnly
                value={initialData.billingEmail}
                className="w-full rounded-xl border border-[var(--test-border)] bg-[var(--test-panel-soft)] px-4 py-2.5 text-sm text-[var(--test-muted)] outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Resource Limits */}
        <div className="rounded-[1.5rem] border border-[var(--test-border)] bg-[var(--test-panel)] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)]">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--test-accent-soft)]/50 text-[var(--test-accent)] border border-[var(--test-border)]">
              <Cpu className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-semibold text-xl">Resource Limits</h2>
              <p className="text-sm text-[var(--test-muted)] mt-0.5">Compute and memory constraints</p>
            </div>
          </div>
          
          <div className="space-y-6 pt-2">
            <div>
              <div className="flex justify-between items-center text-sm mb-3">
                <span className="font-medium text-[var(--test-muted)]">Max RAM Limit (GB)</span>
                <span className="font-semibold text-lg">{ramLimit} GB</span>
              </div>
              <input
                type="range"
                min="16"
                max="256"
                step="8"
                value={ramLimit}
                onChange={(e) => setRamLimit(Number(e.target.value))}
                className="w-full accent-[var(--test-accent)] cursor-pointer"
              />
              <div className="mt-3 text-xs text-[var(--test-muted)] flex items-center gap-1.5 bg-[var(--test-panel-soft)] p-2 rounded-lg border border-[var(--test-border)]">
                <AlertCircle className="h-4 w-4 shrink-0" />
                Impacts overall project deployment capacity
              </div>
            </div>

            <div className="rounded-xl border border-[var(--test-border)] bg-[var(--test-panel-muted)] p-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium flex items-center gap-2 text-[var(--test-foreground)]">
                  <HardDrive className="h-4 w-4 text-[var(--test-muted)]" /> Current Usage
                </span>
                <span className="text-sm font-semibold">{initialData.ramUsed} / {ramLimit} GB</span>
              </div>
              <div className="h-3.5 w-full overflow-hidden rounded-full bg-[var(--test-panel-soft)] border border-[var(--test-border)]">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    (initialData.ramUsed / ramLimit) > 0.8 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, (initialData.ramUsed / ramLimit) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end pt-6 border-t border-[var(--test-border)]">
        <Button
          onClick={handleSave}
          disabled={isPending || (name === initialData.orgName && ramLimit === initialData.ramLimit)}
          className="rounded-xl bg-[var(--test-foreground)] text-[var(--test-panel)] px-6 py-2.5 text-sm font-medium transition hover:opacity-90 disabled:opacity-50 inline-flex items-center"
        >
          {isPending ? "Saving..." : <><Save className="mr-2 h-4 w-4" /> Save Changes</>}
        </Button>
      </div>
    </div>
  );
}
