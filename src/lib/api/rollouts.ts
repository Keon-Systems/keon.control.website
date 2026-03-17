export async function getActiveRollouts() {
  const res = await fetch("/api/rollouts/active");
  if (!res.ok) throw new Error("Failed to load active rollouts");
  return res.json();
}

export async function getRolloutFlags() {
  const res = await fetch("/api/rollouts/flags");
  if (!res.ok) throw new Error("Failed to load rollout flags");
  return res.json();
}
