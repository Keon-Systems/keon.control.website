export async function getFinanceBilling() {
  const res = await fetch("/api/finance/billing");
  if (!res.ok) throw new Error("Failed to load finance billing");
  return res.json();
}

export async function getFinanceCollections() {
  const res = await fetch("/api/finance/collections");
  if (!res.ok) throw new Error("Failed to load finance collections");
  return res.json();
}

export async function getAzureSpend() {
  const res = await fetch("/api/finance/azure-spend");
  if (!res.ok) throw new Error("Failed to load Azure spend");
  return res.json();
}
