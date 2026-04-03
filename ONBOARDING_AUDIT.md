# KEON CONTROL — NEW-CUSTOMER ONBOARDING AUDIT

**Audit date:** 2026-04-03
**Scope:** Full first-use journey from magic link through usable product
**Auditor perspective:** First-time customer, enterprise-technical, zero prior training

---

## 1. Executive Verdict

### ❌ NOT READY

The product has a coherent onboarding flow, a real design aesthetic, and a well-engineered state machine. None of that saves it from a fundamental problem: **it is not built for customers yet — it is built for people who already understand what it does.**

A brand new customer arriving via magic link will experience a product that never tells them what it is, uses terminology that belongs in architecture documents, surfaces developer commentary as UI copy, silently shows mock data as if it were real, breaks its own step numbering, and then drops them into a navigation system where half the routes are hidden from the sidebar.

The onboarding flow itself is close. The post-onboarding experience is not. The information architecture is split across two contradictory systems. And the product copy reads like internal Keon doctrine rather than a customer-facing product.

These are not polish issues. They block comprehension and trust.

---

## 2. Customer Journey Summary

### The path as it exists today

**Landing (/):**
The user hits `/` after clicking the magic link. They see a dark screen with "Keon Control" in large type and the message: *"Checking your workspace setup."* Immediately redirected — either to `/onboarding` (first time) or `/control` (returning). There is no loading indicator beyond the static text. No context. No branding. No value proposition. Just a redirect message that sounds like infrastructure feedback.

**Arrival Step (Step 0):**
The first screen the new customer actually sees is titled "Welcome to Keon Control" with the eyebrow label **"Step 0"**. Three teaser cards read: "Choose what you want to enable first," "Confirm the right workspace for your setup," and "Watch your first governed decision produce a receipt." There is a single CTA: **Begin Setup**.

Nothing on this screen explains what Keon Control is, what problem it solves, or why the user should care about any of the three bullets. The phrase "governed decision produce a receipt" is jargon to a new customer. Receipts of what? Governed by whom?

**Intent Selection (Step 1):**
Three options: "Govern AI actions," "Add memory and context," "Enable oversight and collaboration." These are reasonably legible but still assume the customer knows what "governed AI actions" means in the Keon context. No example use cases. No "what does this mean in practice." Multi-select, but no guidance on whether most people pick one or all three.

**Scope Confirmation (Step 3):** ← Bug: labeled "Step 3", should be Step 2
Asks the user to "Confirm your workspace." If the tenant API loads, shows the detected workspace with a confirm button. Loading state is handled gracefully. Error state says "We're preparing your workspace" with a retry — but offers no explanation of what "workspace" means in Keon's data model or why this confirmation matters.

**Policy Baseline (Step 3):** ← Bug: ALSO labeled "Step 3", should be Step 4
Three options: Strict, Balanced, Flexible. Well-designed. The descriptions are the clearest writing in the entire onboarding flow. The "Best when..." outcomes are genuinely helpful. This is the strongest step.

**First Governed Action (Step 4):**
An animated demo showing a decision pipeline: Intent → Evaluation → Policy → Decision → Receipt. Users can toggle between Strict and Flexible governance to see how outcomes change. This is a strong concept. However: the receipt data shown here is clearly constructed (hardcoded receiptId like `rcpt_8d2f1a`, timestamp `2026-03-27T14:00:12.000Z`) but is presented without any "this is a demo" label. A careful customer will wonder if this is a real action that was just executed against their data.

**Complete (Step 5):**
"Your system is now governed." Summary cards showing workspace, baseline, and enabled outcomes. CTA: "Enter Control Plane." Well done. But nothing tells the user what they will find in the control plane, what to do first, or how long it will take.

**Control Plane (/control):**
"Control Plane" page with a "Governed system active" card, three "Continue from here" tiles (Receipts, Policies, Collective), and a right rail with "Current posture" showing raw booleans (`Workspace confirmed: yes`, `Operator mode: not yet enabled`). The NextStepCard floats above every page in the main layout and provides the most actionable guidance — but it is a tiny card at the top, not a structured onboarding experience.

**After this: complete confusion.** The sidebar shows 10 items across 3 sections (Core, Operator, Collective Detail). But the command palette (⌘K) reveals a completely different set of routes — Incidents, Observability, Security, Finance, Infrastructure, Communications, Rollouts, Support, Audit — that do not appear in the sidebar at all. The user has no way to discover these from the standard navigation.

### Where it works
- The onboarding state machine is solid and bug-resistant
- Policy baseline selection is clear and well-written
- The first-governed-action demo is conceptually strong
- The loading/error/retry states are handled cleanly
- The visual design is distinctive and intentional

### Where it breaks
- Never explains what Keon is or what problem it solves
- Step numbering is broken (Step 0, Step 1, Step 3, Step 3, Step 4, Step 5)
- "Account ready" badge shows while the user is still mid-setup
- Progress bar labels show raw state machine enum names ("intent selection", "scope confirmation")
- Onboarding state is localStorage only — lost on device switch or cache clear
- Receipts page loads silently from mock fixture files with no demo indicator
- Collective page footer contains a developer note about mock-backed data — visible to customers
- DoctrineExplainer cards ("Why this moved," "Why settings moved down") read as internal dev commentary
- Sidebar and command palette are entirely different navigation systems
- Dozens of routes exist but are hidden from the sidebar entirely
- Product copy is dense with insider terminology throughout

---

## 3. Definition of "100% Ready to Start Using"

Before a customer can genuinely use Keon Control, all of the following must be true:

1. **Customer understands what Keon does** — they can describe the product in one sentence after the landing experience
2. **Customer knows what Keon Control is** — they understand this is the management/governance plane, not a Keon runtime
3. **Tenant/workspace is confirmed** — the system is bound to the correct organizational account
4. **Environment is selected** — sandbox or production, with clear explanation of the difference
5. **Policy baseline is set and published** — not just selected; the hash must be published so receipts can bind to it
6. **User understands their role** — they know if they are an admin, operator, or viewer, and what that means
7. **At least one real integration path is active or understood** — either an API key exists, or the user knows the next step to get one
8. **User knows what to do next** — they have a clear, unambiguous next action
9. **User can trust what they see** — all data on screen is either real or clearly labeled as demo
10. **User can navigate the product** — all main sections are discoverable from the navigation

---

## 4. Gap Analysis Against Ready State

### 4.1 — Customer never learns what Keon does
- **Missing:** A single sentence or short explanation anywhere in onboarding or the landing that tells the user what Keon Control is and why they have it
- **Where it should be:** Arrival step, before the setup begins
- **Severity: Critical**

### 4.2 — Policy baseline is selected but never published
- **Missing:** The onboarding flow has the user select a baseline (Strict/Balanced/Flexible) but never triggers the "Publish baseline" action. That button lives on the Policies page, which the user must find after onboarding. Until published, the policy hash doesn't bind to receipts.
- **Where it should be:** Either the policy baseline step should call publish, or the complete step should surface it with a clear explanation
- **Severity: Critical**

### 4.3 — No API key / integration path during onboarding
- **Missing:** A new customer has no idea how to connect their runtime to Keon. The Integrations page exists (`/integrations`) but is not surfaced in the onboarding flow. The sidebar labels it "Integrations" but the page title is "Developer Setup."
- **Where it should be:** Either as an optional onboarding step or as a clearly marked "Next: connect your system" step at the end of onboarding
- **Severity: High**

### 4.4 — Onboarding state is localStorage only
- **Missing:** The `keon.onboarding.state` key in localStorage is the sole persistence mechanism. If a customer completes onboarding on one device and opens the product on another, they re-enter onboarding from scratch. If they clear browser storage, same result.
- **Where it should be:** Backend persistence for onboarding completion state, tied to the authenticated user or tenant
- **Severity: High**

### 4.5 — Step numbering is broken
- **Missing:** Correct sequential step labels. Currently: Step 0, Step 1, Step 3, Step 3, Step 4, Step 5. Both Scope Confirmation and Policy Baseline are labeled "Step 3."
- **Where it should be:** Fixed to Step 1–5 (or Step 1 of N throughout)
- **Severity: High** — Users notice this immediately and it erodes trust

### 4.6 — "Account ready" badge shows during active setup
- **Missing:** The OnboardingLayout header has a static badge reading "Account ready" in the top-right corner while the user is actively mid-setup. This is directly contradicted by the setup flow happening below it.
- **Where it should be:** Either removed entirely, or replaced with "Setup in progress" / step indicator
- **Severity: High**

### 4.7 — Receipts page silently loads mock data
- **Missing:** The `/receipts` page fetches from `/mock/pt013/happy` and `/mock/pt013/gate_deny` fixture files. No indicator that this is demo or sample data. Loading text says "Scanning chain of custody..." which sounds operational. Empty state says "No matching receipts found in current registry scan." A customer cannot tell if these are their real receipts.
- **Where it should be:** A prominent "Sample data" or "Demo receipts" label, or actual tenant-scoped receipts from the backend
- **Severity: High**

### 4.8 — Developer commentary is live in production UI
- **Missing:** The Collective page (`/collective`) has a footer that reads: *"The live submit workflow is real and host-backed. The observer views below remain read-only, and some deeper Collective pages still surface projection-only or mock-backed data until their backend contracts are merged."* This is a developer status note shipped as customer-facing UI copy. It will alarm any customer who reads it.
- **Where it should be:** Removed entirely. Feature availability should be communicated via proper in-app states, not developer footnotes.
- **Severity: High**

### 4.9 — DoctrineExplainer cards appear on multiple customer-facing pages
- **Missing:** Multiple pages (Settings, Integrations, Cockpit/System State, Policies) contain a `DoctrineExplainer` component with titles like "Why this moved," "Why settings moved down," "Why this moved later," and "What the baseline changes." These read as internal architecture justifications, not customer guidance. They add noise without helping the customer act.
- **Where it should be:** Removed or replaced with contextual help that answers "what should I do here" rather than "here is why we built it this way"
- **Severity: Medium**

### 4.10 — Sidebar and command palette are completely divergent
- **Missing:** The sidebar and the ⌘K command palette navigate to completely different sections of the product. The sidebar covers: Control, Receipts, Policies, Tenants, Integrations, Collective, System State, Usage, API Keys, Settings, Deliberations, Reforms, Legitimacy. The command palette covers: Fleet, Tenants, Incidents, Observability, Security, Finance, Infrastructure, Communications, Rollouts, Support, Audit, Settings. These two navigation systems do not overlap for 10+ routes.
- **Where it should be:** A single unified navigation surface. All routes should be in the sidebar, or at minimum, the command palette should not navigate to routes that have no sidebar home.
- **Severity: High**

### 4.11 — "Fleet" in command palette navigates nowhere useful
- **Missing:** The command palette has a "Fleet" item described as "Operator command surface" that routes to `/`. But `/` is just `EntryRedirect` — which shows "Checking your workspace setup." and immediately redirects. "Fleet" is a vestigial label from a prior product version.
- **Severity: Medium**

### 4.12 — User role/identity is never established
- **Missing:** At no point does the user learn what role they have (admin? operator? viewer?), what permissions that grants, or what actions they are authorized to take. The topbar shows "Operator mode: not yet enabled" as raw system state with no explanation of what operator mode is or how to enable it.
- **Where it should be:** Either in the onboarding welcome, or in a persistent identity banner in the control plane
- **Severity: Medium**

### 4.13 — Progress bar in onboarding uses internal enum names
- **Missing:** The `formatStepLabel` function converts `INTENT_SELECTION` → "intent selection", `SCOPE_CONFIRMATION` → "scope confirmation". These raw enum names appear in the onboarding progress bar as the current step indicator. They look like system debug output, not user-facing step names.
- **Where it should be:** Human-readable step names: "Choose your goals," "Confirm your workspace," "Set governance rules," "See it in action," "Ready"
- **Severity: Medium**

### 4.14 — No back navigation in onboarding
- **Missing:** Once a user advances past a step, there is no back button. The state machine is forward-only. If a user mis-selects their intent or changes their mind on the policy baseline, they cannot go back without resetting the entire flow.
- **Where it should be:** A back button on each step, or the ability to navigate to previous steps in the progress bar
- **Severity: Medium**

### 4.15 — "Collective Cognition" page is incomprehensible
- **Missing:** The Collective page h1 reads "Collective Cognition." The subtitle reads: *"Constitutional operator surface for live inert cognition submission plus observational views for deliberations, reform artifacts, and legitimacy assessments."* The "Submit To Collective" CTA says: *"Launch a real Collective run, bind tenant and actor identity, and inspect canonical host artifacts without implying authorization or execution authority."* None of this is comprehensible to a new customer.
- **Severity: Medium**

---

## 5. Step-by-Step Friction Log

### Step 1 — Magic link click → Landing

**User sees:** A dark screen with "Keon Control" in large text and the message "Checking your workspace setup." in small monospace. After ~200ms, instant redirect.

**User thinks:** "Am I loading? Is something wrong? What is this checking? What workspace?"

**What's confusing:** The message sounds like a system diagnostic, not a welcome. There is no product identity, no context, no indication of what's about to happen.

**What should happen instead:** A proper loading/welcome state that says something like "Welcome to Keon Control — getting your workspace ready." with the logo prominent and a brief value statement visible during the load.

---

### Step 2 — Arrival / Welcome Step

**User sees:** Header bar with "KEON CONTROL / Guided activation", a progress bar, and "Account ready" badge. Main panel: "Welcome to Keon Control" with three cards (steps preview) and a "Begin Setup" button.

**User thinks:** "OK I guess I click Begin Setup. But what IS this? What does it do? The badge says 'Account ready' but I'm about to set it up — is it already done?"

**What's confusing:**
- "Account ready" badge implies setup is complete before it begins
- No explanation of what Keon Control does
- "Watch your first governed decision produce a receipt" — receipts of what? Governed by who?
- The eyebrow says "Step 0" — who starts counting at zero in a user flow?

**What should happen instead:** Arrival should spend 3–4 sentences explaining what Keon does in outcome language. Something like: "Keon makes every AI action in your organization traceable, auditable, and governed by your rules. This setup takes 5 minutes and ends with your first recorded decision." Then the three steps preview. The badge should say "Setup starting" or be removed.

---

### Step 3 — Intent Selection

**User sees:** "Step 1 / What do you want Keon Control to turn on first?" with three option cards: Govern AI actions, Add memory and context, Enable oversight and collaboration.

**User thinks:** "I'm not sure exactly what 'govern AI actions' means in this context. Does selecting all three mean I have to configure all three right now? What if I only need one?"

**What's confusing:**
- Multi-select with no guidance on typical selection ("most customers start with just one")
- No examples of what each option looks like in practice
- "Enable oversight and collaboration" is vaguer than the others
- No indication of time/effort commitment per option

**What should happen instead:** Add a "most popular" marker on one option. Add a single line of "for example:" beneath each description. Make it clear that selections can be changed later without consequences.

---

### Step 4 — Scope Confirmation (labeled "Step 3" — bug)

**User sees:** Eyebrow reads "Step 3" but this is the third step (after Arrival = 0, Intent = 1). Panel shows the detected workspace name with a "Confirm and continue" button.

**User thinks:** "Wait, did I skip Step 2? Or is the numbering wrong?" Then: "What does 'confirming the workspace' actually do? Why is this a manual step?"

**What's confusing:**
- Step numbering is wrong — this is labeled Step 3 and so is the next step
- "We use this to load your policies, receipts, and configuration" — policies and receipts haven't been mentioned yet, so this is forward-referencing jargon
- The description doesn't explain what a "workspace" is in Keon's model

**What should happen instead:** Correct the step number. Explain the workspace in plain language: "This is the organizational account your Keon governance will apply to. Everything you configure here will be tied to this workspace."

---

### Step 5 — Policy Baseline (labeled "Step 3" — duplicate bug)

**User sees:** ALSO labeled "Step 3" in the eyebrow. Three cards: Strict, Balanced, Flexible — each with a clear title, description, and outcome statement.

**User thinks:** "Two Step 3s? Is this a bug? But wait, these options are actually pretty clear."

**What's confusing:**
- Step numbering is wrong (should be Step 3 of 5 or similar)
- Title says "Choose your governance baseline" — "governance baseline" still sounds technical. "Choose how strict to be about AI actions" would be clearer
- No "you can change this later" reassurance before committing

**What should happen instead:** Fix step number. Rename to "Choose your starting posture." Add a note: "You can adjust this any time from the Policies page."

---

### Step 6 — First Governed Action

**User sees:** "Step 4 / Watch a governed action resolve." Animated sequence showing a decision pipeline. Toggle between Strict and Flexible. Receipt card appears with hardcoded IDs like `rcpt_8d2f1a` and timestamp `2026-03-27T14:00:12.000Z`.

**User thinks:** "This is cool. But... did something actually just happen? Are these real IDs? Is this data from my workspace? Should I be doing something or just watching?"

**What's confusing:**
- The receipt data looks real (has real-format IDs, timestamps) but is hardcoded demo data
- No "this is a simulation" label anywhere
- The description says "The same action runs through the same sequence every time" — fine, but makes it sound deterministic/fake, not illustrative
- The toggle between Strict/Flexible is well-done but the connection between "this preview starts in Strict" and the baseline they just selected is confusing (your baseline was Balanced but the preview defaults to Strict)

**What should happen instead:** Add a "Demo simulation — no real actions taken" label prominently. Explain that after setup, real actions from their AI workflows will produce receipts like this. Align the default toggle with the policy baseline they selected.

---

### Step 7 — Complete Step

**User sees:** "Step 5 / Your system is now governed." Three summary cards: Workspace, Baseline, Enabled outcomes. CTA: "Enter Control Plane."

**User thinks:** "OK, I'm done with setup. Now what? What is the 'Control Plane'? What should I do first when I get there?"

**What's confusing:**
- "Enter Control Plane" is insider language — what is a "control plane" to a non-SRE?
- No preview of what they'll see next
- No "your first task is X" guidance
- Policy baseline was SELECTED but was it PUBLISHED? The Policies page has a "Publish baseline" button that hasn't been clicked yet.

**What should happen instead:** "Go to your dashboard" is a better CTA. The completion screen should include a 1-2-3 next steps list: "1. Your policies are set. Next: publish your baseline. 2. Connect your first integration. 3. Watch your first real receipt arrive."

---

### Step 8 — Control Plane landing (/control)

**User sees:** "Control Plane" header. "Governed system active" card with three stat tiles (Workspace, Baseline, Enabled outcomes). "Continue from here" card with links to Receipts, Policies, Collective. Right rail: "Current posture" showing raw booleans. "What changed" card explaining architecture decisions.

**User thinks:** "Which of these three things should I do first? Why does 'Current posture' show me `Workspace confirmed: yes` and `Operator mode: not yet enabled`? What is operator mode and why isn't it enabled? Is that a problem?"

**What's confusing:**
- Three equal options with no priority — "should I do Receipts, Policies, or Collective first?"
- `Operator mode: not yet enabled` displays as a raw system flag with no explanation and no action. Is this a blocker? A warning? Irrelevant?
- "What changed" card says "The guided activation flow handled the first-run experience..." — this is documentation commentary, not customer-facing content
- The `NextStepCard` at the top of the page is trying to do this job but it competes with the page content instead of being the dominant signal

**What should happen instead:** Remove the "What changed" card entirely. Prioritize "Receipts" as the clear first destination with an explanation: "Your first receipt was just generated in setup — see it here." Surface "Operator mode not yet enabled" only if it actually blocks something, with an action to resolve it.

---

### Step 9 — Navigating post-onboarding

**User sees:** A sidebar with: Control, Receipts, Policies, Tenants, Integrations, Collective, System State (Core section); Usage, API Keys, Settings (Operator section); Deliberations, Reforms, Legitimacy (Collective Detail section).

**User thinks:** "Where are all the other things I might expect? Incidents? Monitoring? What does 'Collective' mean? What is 'System State'? Why is 'Legitimacy' a menu item?"

**What's confusing:**
- "System State" is the sidebar label for what the page calls "Cockpit" and what some components call "expert inspection surface" — three different names for the same place
- "Collective Detail" as a section header with sub-items "Deliberations," "Reforms," "Legitimacy" — these are deeply abstract
- Missing entirely: Incidents, Observability, Security, Finance, Infrastructure, Communications, Rollouts, Support, Audit — all accessible via ⌘K command palette only
- No visual distinction between "core customer features" and "advanced/operator-only features"

---

## 6. Navigation / IA Findings

### Label Problems

| Current Label | Problem | Better Alternative |
|---|---|---|
| Control | Too generic — is this the dashboard? | Dashboard |
| System State | Wrong route (`/cockpit`), third name for this page | Advanced Inspection |
| Collective | Abstract — what is this? | Governance |
| Collective Detail (section) | Grouping label for sub-items is confusing | (remove section label, put items under Governance) |
| Deliberations | Insider term | Discussions or Review Sessions |
| Reforms | "Reform" implies political process | Policy Changes |
| Legitimacy | Abstract governance concept | Trust Score |
| Receipts | Ambiguous — receipts of what? | Decision Log |
| Overrides | No context for what's being overridden | Policy Exceptions |
| Cockpit | Internal name that doesn't match the sidebar label | (align to "System State" or change both) |
| Operator (section title in sidebar) | Users don't know if they're an "operator" | Configuration |

### Misplaced / Missing Sections

- **Incidents, Observability, Security, Finance, Infrastructure, Communications, Rollouts, Support, Audit** are all full sections of the product accessible via command palette and direct URL but have NO sidebar entry. They are invisible to anyone who doesn't know ⌘K exists. This is not a power-user optimization — it is navigation amnesia.

- **The Collective Detail section** at the bottom of the sidebar exposes Deliberations, Reforms, and Legitimacy as top-level nav items. These should be sub-items under Collective/Governance, not standalone sidebar entries.

- **"Usage" and "API Keys"** are in the "Operator" sidebar section but are relevant to any paying customer. They should be more prominently placed.

### Pages That Appear Too Early

- **System State / Cockpit** — gated behind `operatorModeEnabled` but still visible in sidebar to everyone. Should only appear after operator mode is enabled.
- **Deliberations, Reforms, Legitimacy** — deep governance tools surfaced at the same navigation level as core product features. Should be nested under Collective.

### Missing Entry Points

- No "Get Help" or documentation link anywhere in the navigation
- No "What's next?" or setup checklist persistent surface post-onboarding
- No notifications or alert center visible in the nav

---

## 7. Terminology Problems

| Term | Problem | Better Alternative |
|---|---|---|
| Governed workspace | Never defined; jargon from the start | "Your organization's Keon account" |
| Governance baseline | Sounds like a compliance audit term | "Your enforcement rules" or "How strict Keon is" |
| Receipts | Ambiguous — could be billing receipts, acknowledgments, or audit records | "Decision log" or "Audit records" or "Governed action records" |
| Collective Cognition | Page heading — completely opaque | "Collective Governance" |
| Constitutional operator surface | Subtitle on Collective page | Remove entirely |
| Live inert cognition submission | Subtitle on Collective page | Remove entirely |
| Canonical host artifacts | Subtitle on Collective page | "Official governance records" |
| Deliberation sessions | Sub-page — too abstract | "Review sessions" |
| Reform artifacts | Sub-page — sounds like political documents | "Policy updates" |
| Legitimacy assessments | Sub-page — abstract governance concept | "Trust evaluations" |
| Civic health | Sub-page — political analogy | "Governance health" |
| Doctrine | Used in DoctrineExplainer component titles | Never surface this word to customers |
| Epoch | Used in Collective page ("EPOCH: X") | Time period / Governance cycle |
| Control plane | CTA label at end of onboarding | "Your dashboard" |
| Operator mode | System flag surfaced to all users | "Advanced access" — and don't surface it unless relevant |
| Projection-only | In the Collective footer developer note | (Remove note entirely) |
| Mock-backed data | In the Collective footer developer note | (Remove note entirely) |
| Receipt-backed request | Developer integration term on Integrations page | "Your first verified request" |
| Chain of custody | Loading text on Receipts page | "Loading your decision log" |
| Scope | Used everywhere without definition | "Workspace" or "your account" |
| Bound scope | Header display text | "Connected to: [workspace name]" |
| Confirmed scope | Multiple locations | "Active workspace" |
| Policy hash | Publication preview text | "Policy fingerprint" or just omit for non-technical users |

---

## 8. Empty / Partial / Error State Findings

### 8.1 — Receipts page: mock data presented as real
**Location:** `/receipts`
**Issue:** Loads data from `/mock/pt013/happy` and `/mock/pt013/gate_deny` fixture files in the public directory. No label indicating this is demo/sample data. The loading text "Scanning chain of custody..." and empty state "No matching receipts found in current registry scan" both sound like real backend queries.
**Fix:** Label these as "Sample receipts" prominently, or connect to a real backend, or show a proper empty state that says "No receipts yet — your first governed action will appear here."

### 8.2 — Collective page: developer note as customer UI
**Location:** `/collective`, page footer
**Issue:** Footer reads: *"The live submit workflow is real and host-backed. The observer views below remain read-only, and some deeper Collective pages still surface projection-only or mock-backed data until their backend contracts are merged."*
**Fix:** Remove immediately. This must not be customer-visible. Feature availability should be expressed through proper in-app empty states, not developer status notes.

### 8.3 — TenantScopeGuard: appears multiple times with no navigation path forward
**Location:** `/policies`, `/api-keys`, `/settings`, `/integrations`
**Issue:** When scope is not confirmed, a "Explicit scope confirmation required" banner appears with a TenantBindingCard below it. This is correct behavior, but the TenantBindingCard is a secondary confirmation widget, not the main onboarding path. A customer who lands on Settings before completing onboarding will see this and not know where the "real" setup is.
**Fix:** The banner should link explicitly to `/onboarding` with a clear message: "Complete your guided setup first, then return here."

### 8.4 — Cockpit/System State: unavailable state is architectural explanation
**Location:** `/cockpit`
**Issue:** When `canOpenCockpit` is false, the page shows a "Why this moved later" card with architectural commentary ("The cockpit is now framed as an expert mode that follows governance comprehension instead of replacing it"). This is developer self-justification, not user guidance.
**Fix:** Replace with: "This view is available once your workspace is active. [Link: Complete setup]"

### 8.5 — `Operator mode: not yet enabled` on Control page
**Location:** `/control`, "Current posture" card
**Issue:** Surfaces a raw system flag with no explanation of what operator mode is, whether it matters, or what to do. Is this a blocker? An optional feature? A concern?
**Fix:** Either explain it inline with a link to enable it, or hide it until it becomes relevant to the user's next action.

### 8.6 — TopBar "Onboarding mode" button does nothing
**Location:** TopBar, post-onboarding
**Issue:** When `operatorModeEnabled` is false, a button labeled "Onboarding mode" appears in the header. It has no click handler that visibly does anything. It appears interactive but has no action.
**Fix:** Either wire it to a meaningful action (e.g., show the setup checklist, link to how to enable operator mode) or remove it.

### 8.7 — Loading state on root redirect
**Location:** `/` and `/get-started`
**Issue:** Shows "Checking your workspace setup." as a static centered string while localStorage is being read. No spinner. No logo beyond the product name. No indication of what the redirect will lead to or how long to wait.
**Fix:** Add a proper loading screen with the logo, a brief product name, and a spinner or progress indicator.

### 8.8 — Sidebar footer note
**Location:** Bottom of sidebar (non-collapsed state)
**Issue:** A small text box reads: *"Guided setup lives outside the control plane and returns here only after activation is complete."* This is developer documentation inside the product navigation. Customers do not need to be told where "guided setup lives."
**Fix:** Remove entirely.

### 8.9 — Tenants page "Add Tenant" button
**Location:** `/tenants`
**Issue:** A prominent "Add Tenant" button exists in the page header. This is clearly an operator/admin-level action. A new customer who just confirmed their one workspace will be confused about why they can "add" more tenants and whether they should.
**Fix:** Gate this button behind an admin role check, or at minimum add a tooltip: "Add a new organizational workspace."

---

## 9. Top 10 Fixes in Priority Order

### Fix 1: Add a product explanation to the Arrival step
**Why it matters:** A customer arriving for the first time has no idea what Keon Control does. Everything else in onboarding depends on this comprehension. Without it, every step feels arbitrary.
**Surface:** `arrival-step.tsx`
**What to change:** Before the three step-preview cards, add 2–3 sentences of plain-language product explanation. Example: *"Keon Control makes every AI action in your organization visible, auditable, and governed by your rules. When an AI takes action on your behalf — sending data, accessing resources, changing configurations — Keon decides whether to allow or block it, and records why. You're here to set up those rules."* Remove the "Step 0" eyebrow. Rename the "Account ready" badge to "Setup in progress" or remove it.

### Fix 2: Fix the step numbering
**Why it matters:** Two steps both labeled "Step 3" is a direct trust-eroding bug. Users notice immediately.
**Surfaces:** `scope-confirmation-step.tsx` (currently "Step 3", should be "Step 2"), `policy-baseline-step.tsx` (currently "Step 3", should be "Step 3"), `first-governed-action-step.tsx` (currently "Step 4", remains "Step 4"), `complete-step.tsx` (currently "Step 5", remains "Step 5").
**What to change:** Re-number the steps correctly — either as "Step N of 5" or "Step N" without the duplication. Renumber Scope Confirmation to Step 2.

### Fix 3: Replace state machine enum names in the progress bar with human-readable labels
**Why it matters:** The progress bar currently shows "intent selection," "scope confirmation," etc. — raw enum names that look like debug output.
**Surface:** `OnboardingLayout.tsx` → `formatStepLabel` function
**What to change:** Replace the `formatStepLabel` function with a lookup map:
```
ARRIVAL → "Welcome"
INTENT_SELECTION → "Choose your goals"
SCOPE_CONFIRMATION → "Your workspace"
POLICY_BASELINE → "Set rules"
FIRST_GOVERNED_ACTION → "See it work"
COMPLETE → "Ready"
```

### Fix 4: Remove the developer footer note from the Collective page
**Why it matters:** A production page that tells customers "some deeper pages still surface mock-backed data until backend contracts are merged" is a catastrophic trust failure.
**Surface:** `src/app/collective/page.tsx`, last `<footer>` element
**What to change:** Delete the footer entirely. Handle partial-readiness through proper per-section empty states instead.

### Fix 5: Label mock data as demo data on the Receipts page
**Why it matters:** The Receipts page loads from fixture files and presents it without any indicator that this is not the customer's real data. This is a deception — even if unintentional.
**Surface:** `src/app/receipts/page.tsx`
**What to change:** Either (a) add a persistent "Demo data — your real receipts will appear here once your runtime is connected" banner, or (b) connect to real tenant-scoped receipts and show a proper empty state when there are none. Option (b) is the right long-term answer.

### Fix 6: Remove all DoctrineExplainer / "Why this moved" cards
**Why it matters:** Sections titled "Why this moved," "Why settings moved down," and "Why this moved later" are internal developer architecture commentary. They add noise without helping the customer act, and they make the product feel like a demo to insiders.
**Surfaces:** `settings/page.tsx`, `integrations/page.tsx`, `cockpit/page.tsx`, `policies/page.tsx`
**What to change:** Delete every `DoctrineExplainer` instance. Replace where needed with contextual help that answers "what do I do here" or with nothing at all.

### Fix 7: Unify the navigation — put the full route set in the sidebar
**Why it matters:** Incidents, Observability, Security, Finance, Infrastructure, Communications, Rollouts, Support, and Audit all exist as full product sections but are invisible in the sidebar. A customer who doesn't know to press ⌘K will never find them.
**Surface:** `sidebar.tsx`
**What to change:** Audit which sections are ready for customer use, then add them to the sidebar with appropriate grouping. Sections still under development should either be hidden or clearly labeled "Coming soon."

### Fix 8: Remove the "Account ready" badge from the onboarding header
**Why it matters:** Showing "Account ready" while the user is actively mid-setup directly contradicts the experience and erodes confidence in the product.
**Surface:** `OnboardingLayout.tsx`, the `<div className="rounded-full...">Account ready</div>` element
**What to change:** Remove it entirely, or replace with a contextual state: "Setting up..." during setup, "Ready" on the Complete step.

### Fix 9: Add a post-onboarding "what to do next" structure
**Why it matters:** After completing the 5-step onboarding flow, the customer is dropped into a dashboard with three equal options and no priority. There is no "here is your next action" moment.
**Surfaces:** `complete-step.tsx`, `control/page.tsx`
**What to change:** On the complete step, add a "3 things to do next" list that gives a concrete, ordered path. On the Control Plane page, make the NextStepCard the most dominant element on the page, not a card above the fold that competes with everything else. Remove the "What changed" card.

### Fix 10: Surface the policy publish step clearly
**Why it matters:** The onboarding flow has the user choose a policy baseline, but "Publish baseline" is a separate button on the Policies page that has not been clicked. Until published, the policy hash doesn't bind to receipts. The product is not technically ready to use.
**Surfaces:** `complete-step.tsx`, `policies/page.tsx`
**What to change:** Either auto-publish the baseline as part of the onboarding APPLY_POLICY_BASELINE state transition, or add an explicit "Publish your policy" step after the baseline selection. Do not let the user reach the "your system is now governed" screen without the baseline being published.

---

## 10. Recommended First-Time Experience Flow

### Phase A — Entry and Orientation (new)
1. **Magic link lands on a welcome screen** — not a redirect message. Logo, product name, one-sentence description, and a loading indicator. While localStorage is checked, the user sees real product branding.

2. **Arrival step — introduce the product first, then start setup.**
   - Remove "Step 0"
   - Add product explanation (2–3 sentences in outcome language)
   - Preview the 4 setup steps with human-readable names
   - Remove "Account ready" badge
   - CTA: "Start setup"

### Phase B — Required Setup (existing, improved)
3. **Step 1: Choose your goals** (currently Intent Selection)
   - Same structure, better guidance: add "most customers start with one" note
   - Add brief examples for each option

4. **Step 2: Confirm your workspace** (currently Scope Confirmation — fix the step number)
   - Add explanation of what "workspace" means in Keon
   - Sandbox vs Production distinction should surface here (not buried in a separate widget)

5. **Step 3: Set your enforcement rules** (currently Policy Baseline — fix the step number and name)
   - Current cards are well-written — keep them
   - Add "you can change this later" reassurance
   - **Add: Publish the baseline as part of this step** — don't defer to /policies

### Phase C — Activation and First Value
6. **Step 4: See Keon in action** (currently First Governed Action)
   - Add prominent "Demo simulation — no real actions taken" label
   - Default toggle should match the baseline the user just selected (not always Strict)
   - Brief text: "When your AI systems are connected, every real action will produce a receipt like this"

7. **Step 5: You're ready** (currently Complete)
   - Summary cards — keep them
   - Add "3 things to do next" ordered list:
     1. "Connect your first integration — takes 5 minutes" → /integrations
     2. "Review your policy baseline" → /policies
     3. "Explore your first demo receipts" → /receipts
   - CTA: "Go to your dashboard" (not "Enter Control Plane")

### Phase D — Guided Post-Onboarding (new)
8. **Dashboard (/control) — make NextStepCard the hero**
   - NextStepCard should be the largest, most prominent element on the page
   - Remove "What changed" card entirely
   - "Current posture" rail: remove raw booleans, show only actionable states
   - Clear three-column "Next steps" with priority ordering

9. **Persistent setup checklist** — a lightweight "Setup X% complete" indicator in the sidebar or topbar that tracks:
   - ✅ Workspace confirmed
   - ✅ Baseline set
   - ☐ Baseline published
   - ☐ First integration connected
   - ☐ First real receipt received
   - This disappears once all are checked

10. **First integration path** — /integrations is already titled "Developer Setup" and has a clear 3-step path. Make this discoverable via the post-onboarding checklist.

---

## 11. Implementation Plan

### Phase 1 — Must-Have Fixes (before any customer sees this)

These are the issues that directly break trust, confuse the core path, or expose internal state to customers.

| Priority | Item | File(s) |
|---|---|---|
| 1 | Remove Collective page developer footer note | `collective/page.tsx` |
| 2 | Add "Demo data" label to Receipts page | `receipts/page.tsx` |
| 3 | Fix step numbering (two Step 3s) | `scope-confirmation-step.tsx`, `policy-baseline-step.tsx` |
| 4 | Remove "Account ready" badge from onboarding header | `OnboardingLayout.tsx` |
| 5 | Replace progress bar enum names with human labels | `OnboardingLayout.tsx` |
| 6 | Add product explanation to Arrival step | `arrival-step.tsx` |
| 7 | Remove all DoctrineExplainer "Why this moved" cards | `settings/page.tsx`, `integrations/page.tsx`, `cockpit/page.tsx`, `policies/page.tsx` |
| 8 | Remove sidebar footer developer note | `sidebar.tsx` |

**Estimated effort:** 1–2 days. All copy/component changes, no architecture required.

---

### Phase 2 — Readiness and Polish (before GA)

These fixes complete the customer journey and bring the product to a genuinely usable state.

| Priority | Item | File(s) |
|---|---|---|
| 1 | Surface policy publish step during or immediately after onboarding | `policy-baseline-step.tsx` or `complete-step.tsx` |
| 2 | Replace Complete step CTA "Enter Control Plane" with "Go to dashboard" + next steps list | `complete-step.tsx` |
| 3 | Add post-onboarding setup checklist (% complete) | New component, `shell.tsx` or sidebar |
| 4 | Rename sidebar labels (System State → consistent, Collective → Governance, etc.) | `sidebar.tsx` |
| 5 | Unify command palette with sidebar — either add all routes to sidebar, or remove orphan routes from palette | `sidebar.tsx`, `command-palette.tsx` |
| 6 | Fix Topbar "Onboarding mode" button (wire to action or remove) | `topbar.tsx` |
| 7 | Fix "Fleet" command palette entry (rename or remove) | `command-palette.tsx` |
| 8 | Fix Cockpit unavailable state (remove architecture commentary) | `cockpit/page.tsx` |
| 9 | Add back navigation to onboarding steps | `OnboardingFlow.tsx`, state machine |

**Estimated effort:** 3–5 days.

---

### Phase 3 — Advanced Optimization (post-launch)

These require backend work or more significant product decisions.

| Priority | Item | Notes |
|---|---|---|
| 1 | Persist onboarding completion state server-side | Currently localStorage only — breaks on device switch |
| 2 | Replace mock fixture receipts with real tenant-scoped receipts | Requires backend receipt API by tenant |
| 3 | Enable/disable sidebar sections based on tenant plan and feature flags | Avoids showing advanced routes to new customers |
| 4 | Full terminology audit and copy pass across all pages | Requires content strategy pass |
| 5 | Add help/documentation links throughout the nav | Missing entirely |
| 6 | Role-based UI — show admin features only to admins | `operatorModeEnabled` exists but isn't used to gate UI consistently |

---

## 12. Receipts (Evidence)

### Routes and files inspected

| Route | File |
|---|---|
| `/` | `src/app/page.tsx` |
| `/get-started` | `src/app/get-started/page.tsx` |
| `/onboarding` | `src/app/onboarding/page.tsx` |
| `/control` | `src/app/control/page.tsx` |
| `/cockpit` | `src/app/cockpit/page.tsx` |
| `/collective` | `src/app/collective/page.tsx` |
| `/receipts` | `src/app/receipts/page.tsx` |
| `/policies` | `src/app/policies/page.tsx` |
| `/integrations` | `src/app/integrations/page.tsx` |
| `/settings` | `src/app/settings/page.tsx` |
| `/api-keys` | `src/app/api-keys/page.tsx` |
| `/tenants` | `src/app/tenants/page.tsx` |

### Components inspected

| Component | File |
|---|---|
| EntryRedirect, ControlGate, OnboardingGate | `components/onboarding/route-gates.tsx` |
| OnboardingFlow | `components/onboarding/OnboardingFlow.tsx` |
| OnboardingLayout | `components/onboarding/OnboardingLayout.tsx` |
| StepShell | `components/onboarding/step-shell.tsx` |
| ArrivalStep | `components/onboarding/steps/arrival-step.tsx` |
| IntentSelectionStep | `components/onboarding/steps/intent-selection-step.tsx` |
| ScopeConfirmationStep | `components/onboarding/steps/scope-confirmation-step.tsx` |
| PolicyBaselineStep | `components/onboarding/steps/policy-baseline-step.tsx` |
| FirstGovernedActionStep | `components/onboarding/steps/first-governed-action-step.tsx` |
| CompleteStep | `components/onboarding/steps/complete-step.tsx` |
| Shell | `components/layout/shell.tsx` |
| Sidebar | `components/layout/sidebar.tsx` |
| TopBar | `components/layout/topbar.tsx` |
| CommandPalette | `components/layout/command-palette.tsx` |
| NextStepCard | `components/control-plane/next-step-card.tsx` |
| DoctrineExplainer | `components/control-plane/doctrine-explainer.tsx` |
| TenantScopeGuard | `components/control-plane/tenant-scope-guard.tsx` |
| TenantBindingCard | `components/control-plane/tenant-binding-card.tsx` |
| SetupPathCard | `components/control-plane/setup-path-card.tsx` |

### State and logic inspected

| Module | File |
|---|---|
| Onboarding state machine | `lib/onboarding/state-machine.ts` |
| Onboarding store (localStorage) | `lib/onboarding/store.tsx` |
| Root layout & metadata | `src/app/layout.tsx` |
| Mock data directory | `public/mock/pt013/` |

### Key bugs confirmed

1. `scope-confirmation-step.tsx` line 1: eyebrow = `"Step 3"` — should be "Step 2"
2. `policy-baseline-step.tsx` line 1: eyebrow = `"Step 3"` — duplicate, should remain "Step 3" but scope step must be corrected
3. `OnboardingLayout.tsx`: "Account ready" static badge — incorrect during active setup
4. `receipts/page.tsx`: loads from `/mock/pt013/` — no demo label
5. `collective/page.tsx` footer: developer status note visible to customers
6. `command-palette.tsx`: "Fleet" item navigates to `/` (redirect only)
7. `topbar.tsx`: "Onboarding mode" / "Operator mode" button has no click handler
8. `layout.tsx` metadata description: `"Governed execution control plane for tenant scope confirmation, policy baselines, receipts, and verified operator inspection"` — jargon-heavy metadata unlikely to help discoverability

---

*End of audit. Version 1.0.*
