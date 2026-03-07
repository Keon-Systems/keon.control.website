import Stripe from "stripe";

type PlanCode = "builder" | "startup" | "growth" | "enterprise";

interface StripePriceCatalog {
  startup?: string;
  growth?: string;
}

function env(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

export function isStripeEnabled() {
  return Boolean(env("STRIPE_SECRET_KEY"));
}

export function getStripeClient() {
  const secretKey = env("STRIPE_SECRET_KEY");
  if (!secretKey) {
    throw new Error("Stripe is not configured");
  }

  return new Stripe(secretKey);
}

export function getStripeWebhookSecret() {
  return env("STRIPE_WEBHOOK_SECRET");
}

export function getStripePriceCatalog(): StripePriceCatalog {
  return {
    startup: env("STRIPE_PRICE_STARTUP") ?? undefined,
    growth: env("STRIPE_PRICE_GROWTH") ?? undefined,
  };
}

export function getStripePriceId(planCode: PlanCode) {
  const prices = getStripePriceCatalog();
  if (planCode === "startup") return prices.startup ?? null;
  if (planCode === "growth") return prices.growth ?? null;
  return null;
}

export function planCodeFromPriceId(priceId: string | null | undefined): PlanCode | null {
  if (!priceId) return null;

  const prices = getStripePriceCatalog();
  if (priceId === prices.startup) return "startup";
  if (priceId === prices.growth) return "growth";
  return null;
}
