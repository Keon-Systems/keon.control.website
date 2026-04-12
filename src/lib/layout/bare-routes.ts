/**
 * Routes that bypass the Shell entirely (no TopBar, no Sidebar, no padding).
 * CollectiveLayoutShell also uses this to suppress CollectiveBanner.
 */
export const BARE_ROUTES = new Set(["/collective/showcase"]);
