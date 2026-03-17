export async function getSloStatus() {
  const res = await fetch("/api/observability/slo");
  if (!res.ok) throw new Error("Failed to load SLO status");
  return res.json();
}
