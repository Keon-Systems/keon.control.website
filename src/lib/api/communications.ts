export async function getCommHistory() {
  const res = await fetch("/api/communications/history");
  if (!res.ok) throw new Error("Failed to load communications history");
  return res.json();
}

export async function getCommTemplates() {
  const res = await fetch("/api/communications/templates");
  if (!res.ok) throw new Error("Failed to load communications templates");
  return res.json();
}
