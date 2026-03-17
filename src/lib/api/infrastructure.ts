export async function getInfraResources() {
  const res = await fetch("/api/infrastructure/resources");
  if (!res.ok) throw new Error("Failed to load infrastructure resources");
  return res.json();
}

export async function getInfraHealth() {
  const res = await fetch("/api/infrastructure/health");
  if (!res.ok) throw new Error("Failed to load infrastructure health");
  return res.json();
}
