"use server";

import { simulateRequest } from "@/lib/mock/request";

export async function sendInvite(emailOrUsername: string, role: string) {
  await simulateRequest(null);
  return { success: true, message: `Invited ${emailOrUsername} as ${role}` };
}
