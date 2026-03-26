import "server-only";

import { simulateRequest } from "@/lib/mock/request";

export type OrgSettingsData = {
  orgName: string;
  billingEmail: string;
  plan: string;
  ramLimit: number;
  ramUsed: number;
};

const fixture: OrgSettingsData = {
  orgName: "Kleffio Corporation",
  billingEmail: "admin@kleff.io",
  plan: "Pro Enterprise",
  ramLimit: 64, // GB
  ramUsed: 42,
};

export async function getOrgSettings(): Promise<OrgSettingsData> {
  return simulateRequest(fixture);
}
