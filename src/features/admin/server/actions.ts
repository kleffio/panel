"use server";

import { simulateRequest } from "@/lib/mock/request";

export async function updateOrgSettings(data: { orgName?: string; ramLimit?: number }) {
  await simulateRequest(null);
  return { success: true, message: "Settings updated successfully" };
}
