export async function getJobHealth() {
  const res = await fetch("/api/observability/jobs");
  if (!res.ok) throw new Error("Failed to load job health");
  return res.json();
}
