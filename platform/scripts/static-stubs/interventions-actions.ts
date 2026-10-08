export async function decideInterventionAction(formData: FormData) {
  void formData;
  return { ok: false as const, error: "This public snapshot is read-only." };
}
