/**
 * ACTIVATION COMPLETION FLAG
 *
 * Raw localStorage primitive that tracks whether the current browser session
 * has completed the magic-link activation and provisioning flow.
 *
 * This is the storage layer beneath the first-run routing system.
 * In component code, prefer useFirstRunState() from @/lib/first-run/state
 * which wraps this flag with React state and SSR-safe hydration.
 *
 * Persistence model:
 *   - Written to localStorage on provisioning_complete (value: "1")
 *   - Read by FirstRunStateProvider to gate the /welcome route
 *   - Cleared only on explicit reset (e.g., re-invite flow)
 *   - Survives tab close / page refresh — not tied to sessionStorage
 *   - Will be superseded by a server-side session flag once real auth exists
 *
 * Key: keon.activation.complete
 */

export const ACTIVATION_COMPLETE_KEY = "keon.activation.complete";

/**
 * Mark activation as complete.
 * Prefer useFirstRunState().markProvisioningComplete() in component code.
 */
export function markActivationComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACTIVATION_COMPLETE_KEY, "1");
}

/**
 * Returns true if the activation completion flag is set.
 * Returns false in SSR context or when the flag is absent/unexpected.
 */
export function isActivationComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ACTIVATION_COMPLETE_KEY) === "1";
}

/**
 * Clear the activation flag. Used when resetting the full first-run flow.
 * Safe to call when the flag is not set.
 */
export function clearActivationFlag(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACTIVATION_COMPLETE_KEY);
}
