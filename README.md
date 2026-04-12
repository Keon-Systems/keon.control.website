# ⚡ Keon Command Center

**Not a Website. A Weapon System.**

Mission control-style dashboard for the Keon governance system. SpaceX Mission Control meets Bloomberg Terminal.

---

## 🎯 Design Philosophy

> "If a C-Suite executive sees this, they should feel the system is more intelligent than they are."

### Core Principles

1. **Sovereignty** - If screenshots leaked, competitors would know this is ours within 5 seconds
2. **Health Visibility** - Trust, safety, and cost metrics visible without scrolling (Glass Rule)
3. **Stability** - No decorative elements. Everything conveys state, risk, or control

---

## 🎨 Orbital Ballistics Design System

### Color Palette

```css
--void: #0B0C10          /* Background - Deep space black */
--gun-metal: #1F2833     /* Panels - Matte steel */
--tungsten: #384656      /* Borders - Industrial metal */
--steel: #C5C6C7         /* Secondary text */
--flash: #EAEAEA         /* Primary text */

/* 5-State Severity Ladder */
--reactor-blue: #45A29E  /* Healthy - Primary action */
--reactor-glow: #66FCF1  /* Healthy - Glow state */
--degraded-amber: #FFB000 /* Degraded - Partial outage, quorum risk */
--safety-orange: #FF6B00 /* Warning - Action required */
--ballistic-red: #FF2E2E /* Critical - System failure */
```

### Typography

- **UI Text**: Inter (300-700) / Rajdhani (300-700)
- **Data Values**: JetBrains Mono (tabular numerals)
- **Numerical Law**: All auditable values MUST be monospace

### No-Go List

❌ Drop shadows
❌ Generous whitespace
❌ Rounded corners >4px
❌ Playful illustrations
❌ Pure white backgrounds
❌ Decorative elements without purpose

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=20.11.0` (recommended: Node 20 LTS)
- `pnpm` (via Corepack: `corepack enable`)

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Expected local URL: [http://localhost:3000](http://localhost:3000)

### Environment Variables (Local Example)

Copy `.env.local.example` to `.env.local`.

Required local variables for governance boot:

- `KEON_CONTROL_GOVERNANCE_MODE=mock` (default local boot, clearly labeled `MOCK`)
- `KEON_CONTROL_GOVERNANCE_BASE_URL=http://localhost:5000` (used only when mode=`live`)
- `KEON_CONTROL_GOVERNANCE_TIMEOUT_MS=5000`

Fail-closed behavior:
- In `live` mode, if upstream governance APIs are unreachable, the UI displays `GOVERNANCE UNAVAILABLE`.
- In `mock` mode, the dashboard loads local mock governance data and labels it `MOCK`.

### Build

```bash
pnpm build
pnpm start
```

### Lint

```bash
pnpm lint
```

---

## ⚙️ Key Features

### 1. Glass Rule Compliance
Critical metrics (trust, safety, cost) are visible without scrolling on 1440p displays.

### 2. Numerical Law
Any value that can be audited, signed, reconciled, or disputed uses monospace font, even inline.

### 3. Explain This Mode
**Hotkey: `?`**

Instantly overlays provenance information for any focused element:
- 📜 Provenance (source, hash, timestamp)
- 🔄 Last Mutation (agent, action, receipt)
- 📋 Policy Source (pack, rule, version)
- ✍️ Signer (identity, public key, verification status)

Press `ESC` to close.

### 4. Command Palette
**Hotkey: `Cmd+K` / `Ctrl+K`**

Quick navigation and actions across the entire system.

### 5. Keyboard Navigation
- `J` / `K` - Navigate lists (vim-style)
- `?` - Explain This mode
- `ESC` - Close overlays
- `Cmd+K` - Command palette

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main dashboard
│   ├── layout.tsx         # Root layout with fonts
│   └── ui-demo/           # Component showcase
├── components/
│   ├── ui/                # Core UI components
│   │   ├── button.tsx
│   │   ├── panel.tsx
│   │   ├── badge.tsx
│   │   ├── data-value.tsx
│   │   ├── status-indicator.tsx
│   │   └── explain-overlay.tsx
│   ├── layout/            # Shell components
│   │   ├── shell.tsx
│   │   ├── topbar.tsx
│   │   ├── sidebar.tsx
│   │   └── command-palette.tsx
│   ├── charts/            # Data visualization
│   │   ├── line-chart.tsx
│   │   ├── gauge.tsx
│   │   ├── activity-feed.tsx
│   │   └── system-status.tsx
│   └── hud/               # HUD metrics
│       ├── metrics-panel.tsx
│       ├── status-bar.tsx
│       └── quick-stats.tsx
├── lib/                   # Utilities
│   ├── utils.ts          # Core utilities
│   ├── format.ts         # Data formatting
│   ├── keyboard.ts       # Keyboard hooks
│   ├── types.ts          # TypeScript types
│   ├── mock-data.ts      # Mock data
│   └── use-explain-mode.ts # Explain mode hook
└── styles/               # Global styles
    ├── tokens.css        # Design tokens
    ├── glow.css          # LED glow effects
    └── globals.css       # Global styles
```

---

## 🧩 Component Library

### UI Components

- **Button** - 6 variants (primary, secondary, ghost, destructive, outline, link)
- **Panel** - Container with optional noise texture and glow
- **Badge** - Status badges (healthy, degraded, warning, critical, offline)
- **DataValue** - Monospace data display with copy-to-clipboard
- **StatusIndicator** - LED-style status lights with glow
- **Input** - Form inputs with mission control styling
- **ExplainOverlay** - Provenance information overlay

### Layout Components

- **Shell** - Main application shell with sidebar and topbar
- **TopBar** - Global navigation and system status
- **Sidebar** - Navigation menu
- **CommandPalette** - Quick actions (Cmd+K)

### Charts & Visualization

- **LineChart** - Time-series data visualization
- **Gauge** - Circular progress indicators
- **ActivityFeed** - Real-time event stream
- **SystemStatus** - Subsystem health grid
- **MetricCard** - KPI display cards

### HUD Components

- **MetricsPanel** - Live metrics dashboard
- **StatusBar** - Always-visible system status
- **QuickStats** - Key performance indicators
- **Clock** - System time display

---

## 🔧 Tech Stack

- **Framework**: Next.js 16.1.1 (App Router)
- **React**: 19.2.3
- **TypeScript**: Latest
- **Styling**: Tailwind CSS 4.0
- **UI Primitives**: Radix UI
- **Charts**: Recharts
- **Command Palette**: cmdk
- **Fonts**: Inter, Rajdhani, JetBrains Mono

---

## 📊 Design Tokens

All design tokens are defined in `src/styles/tokens.css` using CSS custom properties:

```css
/* Access in components */
className="bg-[--void] text-[--flash] border-[--tungsten]"

/* Glow effects */
className="glow-reactor glow-pulse-reactor"
```

---

## 🎯 C-Suite Check

**Question**: If screenshots leaked, would a competitor know this is ours within 5 seconds?

**Answer**: Yes.

- Unique Orbital Ballistics color palette
- Distinctive LED glow effects
- Mission control aesthetic
- Monospace data values
- No decorative elements
- Mechanical, instant feedback

---

## 📝 License

Proprietary - Keon Systems

---

