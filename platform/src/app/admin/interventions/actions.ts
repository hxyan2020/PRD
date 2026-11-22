"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission } from "@/lib/auth";
import { decideIntervention } from "@/lib/ai/intervention";

export async function decideInterventionAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !hasPermission(user.role_code, "intervene.operate")) {
    return { ok: false as const, error: "Forbidden" };
  }

  const id = Number(formData.get("id"));
  const decision = String(formData.get("decision") || "");
  const note = String(formData.get("note") || "");

  if (!id || !["APPROVED", "REJECTED"].includes(decision)) {
    return { ok: false as const, error: "id and decision required" };
  }

  try {
    const result = decideIntervention({
      interventionId: id,
      decision: decision as "APPROVED" | "REJECTED",
      note,
      actor: { id: user.id, name: user.name },
    });
    revalidatePath("/admin/interventions");
    return { ok: true as const, ...result };
  } catch (e) {
    return { ok: false as const, error: (e as Error).message };
  }
}
