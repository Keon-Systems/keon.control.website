/**
 * Presentation-only bridge: Codex PresentationTone → existing Badge variant.
 *
 * This must stay dumb — tone → badge variant, nothing more.
 * No semantic remapping, no lifecycle reinterpretation, no domain labels.
 */

import type { PresentationTone } from "./dto";

export type BadgeVariant = "healthy" | "warning" | "critical" | "neutral" | "offline";

const TONE_TO_VARIANT: Record<PresentationTone, BadgeVariant> = {
  success: "healthy",
  warning: "warning",
  danger: "critical",
  info: "neutral",
  neutral: "neutral",
};

export function toneToVariant(tone: PresentationTone): BadgeVariant {
  return TONE_TO_VARIANT[tone];
}
