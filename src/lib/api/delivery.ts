export async function getDeliveryHealth() {
  const res = await fetch("/api/observability/delivery");
  if (!res.ok) throw new Error("Failed to load delivery health");
  return res.json();
}
