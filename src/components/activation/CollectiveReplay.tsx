"use client";

/**
 * COLLECTIVE REPLAY — KEON INTELLIGENCE VISUALIZATION
 *
 * This is NOT decoration. This is the product's first impression.
 *
 * While provisioning runs, this sequence teaches the user what Keon does:
 *   1. Keon receives an intention / goal
 *   2. Keon explores multiple execution paths
 *   3. Keon evaluates and challenges each path
 *   4. Keon selects the governed path
 *   5. Keon produces a receipt / proof of decision
 *
 * This must be understood WITHOUT reading a manual.
 * It is passive only. No controls. No interaction. Loops continuously.
 *
 * All scenarios are clearly labeled as examples.
 * No ambiguity between real and demo data.
 */

import { cn } from "@/lib/utils";
import * as React from "react";

// ─── Scenario Data ────────────────────────────────────────────────────────────

interface ReplayPath {
  id: string;
  label: string;
  sublabel: string;
  rejectionReason?: string;
  rejectionDetail?: string;
  riskLevel: "low" | "medium" | "high";
  outcome: "approved" | "denied" | "selected";
}

interface GovernanceCheck {
  label: string;
  status: "pass" | "block";
  detail: string;
}

interface ReplayScenario {
  id: string;
  directive: string;
  directiveSource: string;
  goalLabel: string;
  goalDescription: string;
  paths: ReplayPath[];
  selectedPathId: string;
  selectedWhy: string;
  outcomeMeaning: string;
  governanceChecks: GovernanceCheck[];
  receiptRef: string;
  policyHash: string;
  lineageRef: string;
  correlationRef: string;
}

const SCENARIOS: ReplayScenario[] = [
  {
    id: "db-migration",
    directive: "Authorize a production schema upgrade with rollback protection.",
    directiveSource: "Release directive · platform deployment runbook",
    goalLabel: "SCHEMA MIGRATION",
    goalDescription: "Database upgrade · v4.2.1 → v4.3.0",
    paths: [
      { id: "p1", label: "Execute now", sublabel: "No snapshot", rejectionReason: "No rollback path", rejectionDetail: "Rejected because recovery evidence is missing before execution.", riskLevel: "high", outcome: "denied" },
      { id: "p2", label: "Stage first", sublabel: "24h validation", rejectionReason: "Policy window not met", rejectionDetail: "Blocked because the validation window did not satisfy the release policy.", riskLevel: "medium", outcome: "denied" },
      { id: "p3", label: "Snapshot + run", sublabel: "Rollback-safe", riskLevel: "low", outcome: "selected" },
      { id: "p4", label: "Defer 48h", sublabel: "Maintenance window", rejectionReason: "Change blocked by urgency", rejectionDetail: "Denied because deferral would violate the directive's approved remediation window.", riskLevel: "low", outcome: "denied" },
    ],
    selectedPathId: "p3",
    selectedWhy: "Selected because it satisfies rollback safety, maintenance policy, and release timing in one governed path.",
    outcomeMeaning: "Execution is authorized before the migration runs. The change is approved, but only within the governed conditions captured in the receipt.",
    governanceChecks: [
      { label: "Rollback evidence", status: "pass", detail: "Snapshot requirement satisfied before authorization." },
      { label: "Maintenance policy", status: "pass", detail: "Window and operator scope match the approved release policy." },
      { label: "Unsafe execution path", status: "block", detail: "Immediate execution without rollback evidence was denied." },
    ],
    receiptRef: "K-9A4C",
    policyHash: "pol_7FA2",
    lineageRef: "lin_db_43",
    correlationRef: "corr_rel_842",
  },
  {
    id: "iam-expansion",
    directive: "Authorize elevated service-account access for a bounded production task.",
    directiveSource: "Access directive · deployment approval chain",
    goalLabel: "ACCESS EXPANSION",
    goalDescription: "Service account · elevated IAM request",
    paths: [
      { id: "p1", label: "Grant full role", sublabel: "Unrestricted", rejectionReason: "Privilege exceeds policy", rejectionDetail: "Rejected because the requested permission scope exceeds the allowed least-privilege envelope.", riskLevel: "high", outcome: "denied" },
      { id: "p2", label: "Scoped policy", sublabel: "Resource-bound", rejectionReason: "Missing strong auth", rejectionDetail: "Blocked because the directive requires MFA-backed authorization for elevated access.", riskLevel: "medium", outcome: "denied" },
      { id: "p3", label: "MFA + scoped", sublabel: "Least-privilege", riskLevel: "low", outcome: "selected" },
      { id: "p4", label: "Escalate review", sublabel: "Human approval", rejectionReason: "Execution paused pending queue", rejectionDetail: "Rejected for this directive because queue latency would miss the approved execution window.", riskLevel: "low", outcome: "denied" },
    ],
    selectedPathId: "p3",
    selectedWhy: "Selected because it meets least-privilege policy, requires strong authentication, and keeps the task inside the approved execution window.",
    outcomeMeaning: "Access is authorized before use. The service account is approved only for the governed scope captured by the receipt and lineage references.",
    governanceChecks: [
      { label: "Least-privilege scope", status: "pass", detail: "Access narrowed to the approved resource boundary." },
      { label: "Strong authorization", status: "pass", detail: "MFA-backed approval satisfied the elevated access requirement." },
      { label: "Unbounded privilege request", status: "block", detail: "Broad role grant denied by policy constraints." },
    ],
    receiptRef: "K-2E7F",
    policyHash: "pol_C91D",
    lineageRef: "lin_iam_18",
    correlationRef: "corr_iam_331",
  },
];

// ─── Animation Phase Model ────────────────────────────────────────────────────
// Each phase maps to a visual state of the SVG tree.

type ReplayPhase =
  | "blank"
  | "goal_appear"
  | "paths_branch"
  | "evaluating"
  | "rejection_reasons"
  | "selecting"
  | "governance"
  | "approved"
  | "hold_result"
  | "fade_out";

const PHASE_DURATIONS_MS: Record<ReplayPhase, number> = {
  blank: 400,
  goal_appear: 900,
  paths_branch: 1400,
  evaluating: 1800,
  rejection_reasons: 1500,
  selecting: 1000,
  governance: 1000,
  approved: 1400,
  hold_result: 2400,
  fade_out: 700,
};

const PHASE_ORDER: ReplayPhase[] = [
  "blank",
  "goal_appear",
  "paths_branch",
  "evaluating",
  "rejection_reasons",
  "selecting",
  "governance",
  "approved",
  "hold_result",
  "fade_out",
];

// ─── Risk Color Mapping ───────────────────────────────────────────────────────

const RISK_COLORS = {
  low: "#45A29E",
  medium: "#FFB000",
  high: "#FF2E2E",
} as const;

const RISK_LABELS = {
  low: "LOW",
  medium: "MED",
  high: "HIGH",
} as const;

// ─── SVG Layout Constants ─────────────────────────────────────────────────────

const VB_W = 560;
const VB_H = 370;

const GOAL_CX = VB_W / 2;
const GOAL_Y = 24;
const GOAL_W = 240;
const GOAL_H = 38;

// 4 path columns
const PATH_XS = [48, 172, 320, 432];
const PATH_Y = 116;
const PATH_W = 92;
const PATH_H = 30;

// Eval row
const EVAL_Y = 208;
const EVAL_R = 14;

// Governance row
const GOVERNANCE_CX = GOAL_CX;
const GOVERNANCE_Y = 262;
const GOVERNANCE_W = 188;
const GOVERNANCE_H = 28;

// Result
const RESULT_CX = GOAL_CX;
const RESULT_Y = 304;
const RESULT_W = 236;
const RESULT_H = 50;

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#66FCF1]">
      {children}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CollectiveReplay({ className }: { className?: string }) {
  const [scenarioIndex, setScenarioIndex] = React.useState(0);
  const [phase, setPhase] = React.useState<ReplayPhase>("blank");
  const [phaseIndex, setPhaseIndex] = React.useState(0);
  const [opacity, setOpacity] = React.useState(1);
  const [inspectionOpen, setInspectionOpen] = React.useState(false);

  const scenario = SCENARIOS[scenarioIndex % SCENARIOS.length];
  const selectedPath = scenario.paths.find((path) => path.id === scenario.selectedPathId) ?? scenario.paths[0];
  const rejectedPaths = scenario.paths.filter((path) => path.outcome === "denied");

  // Advance phases
  React.useEffect(() => {
    const currentPhase = PHASE_ORDER[phaseIndex % PHASE_ORDER.length];
    setPhase(currentPhase);

    const duration = PHASE_DURATIONS_MS[currentPhase];

    const timer = setTimeout(() => {
      const nextIndex = (phaseIndex + 1) % PHASE_ORDER.length;

      // When we loop back to the start, advance to next scenario
      if (nextIndex === 0) {
        setScenarioIndex((i) => (i + 1) % SCENARIOS.length);
      }

      setPhaseIndex(nextIndex);
    }, duration);

    return () => clearTimeout(timer);
  }, [phaseIndex]);

  // Manage outer opacity for fade_out phase
  React.useEffect(() => {
    setOpacity(phase === "fade_out" || phase === "blank" ? 0 : 1);
  }, [phase]);

  const show = {
    goal: ["goal_appear", "paths_branch", "evaluating", "rejection_reasons", "selecting", "governance", "approved", "hold_result"].includes(phase),
    paths: ["paths_branch", "evaluating", "rejection_reasons", "selecting", "governance", "approved", "hold_result"].includes(phase),
    eval: ["evaluating", "rejection_reasons", "selecting", "governance", "approved", "hold_result"].includes(phase),
    rejectionReasons: ["rejection_reasons", "selecting", "governance", "approved", "hold_result"].includes(phase),
    selected: ["selecting", "governance", "approved", "hold_result"].includes(phase),
    governance: ["governance", "approved", "hold_result"].includes(phase),
    result: ["approved", "hold_result"].includes(phase),
  };

  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[3px] border border-white/[0.06]",
        "bg-[linear-gradient(160deg,#060a10_0%,#090d16_60%,#060a10_100%)]",
        className
      )}
      data-testid="collective-replay"
    >
      {/* Grid texture overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Header */}
      <div className="relative flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#45A29E]" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#45A29E]">
              Collective Engine
            </span>
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/26">
            Decision authorized before execution
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/20" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/30">
            {scenario.id}
          </span>
        </div>
      </div>

      {/* Scenario label */}
      <div className="relative flex items-center justify-between gap-4 border-b border-white/[0.04] px-5 py-2.5">
        <div>
          <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
            {scenario.goalLabel}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-white/30">{scenario.goalDescription}</div>
        </div>
        <button
          type="button"
          onClick={() => setInspectionOpen((value) => !value)}
          className={cn(
            "shrink-0 rounded-[2px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors",
            inspectionOpen
              ? "border-[#66FCF1]/60 bg-[#66FCF1]/10 text-[#66FCF1]"
              : "border-white/[0.12] bg-white/[0.03] text-white/56 hover:border-[#45A29E]/40 hover:text-white/72"
          )}
          aria-expanded={inspectionOpen}
          aria-controls="collective-deep-inspection"
        >
          {inspectionOpen ? "Close inspection" : "Inspect decision"}
        </button>
      </div>

      {/* SVG visualization */}
      <div
        className="relative flex-1 transition-opacity duration-500"
        style={{ opacity }}
      >
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="h-full w-full"
          aria-hidden="true"
          role="presentation"
        >
          <defs>
            <filter id="reactor-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="glow-strong" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ── Lines: Goal → Paths ── */}
          {scenario.paths.map((path, i) => {
            const px = PATH_XS[i];
            const pathCX = px + PATH_W / 2;
            const goalRight = GOAL_CX + GOAL_W / 2;
            const goalLeft = GOAL_CX - GOAL_W / 2;
            const startX = Math.min(Math.max(pathCX, goalLeft), goalRight);
            return (
              <path
                key={`gl-${path.id}`}
                d={`M ${startX} ${GOAL_Y + GOAL_H} C ${startX} ${GOAL_Y + GOAL_H + 28} ${pathCX} ${PATH_Y - 28} ${pathCX} ${PATH_Y}`}
                fill="none"
                stroke="#45A29E"
                strokeWidth="1"
                strokeOpacity={show.paths ? 0.35 : 0}
                className="transition-all duration-700"
              />
            );
          })}

          {/* ── Lines: Paths → Eval ── */}
          {scenario.paths.map((path, i) => {
            const px = PATH_XS[i];
            const pathCX = px + PATH_W / 2;
            const isSelected = path.id === scenario.selectedPathId;
            const isDenied = show.rejectionReasons && path.outcome === "denied";
            return (
              <line
                key={`pe-${path.id}`}
                x1={pathCX}
                y1={PATH_Y + PATH_H}
                x2={pathCX}
                y2={EVAL_Y - EVAL_R}
                stroke={isDenied ? "#FF2E2E" : isSelected && show.selected ? "#66FCF1" : "#45A29E"}
                strokeWidth="1"
                strokeOpacity={show.eval ? (isDenied ? 0.25 : isSelected && show.selected ? 0.8 : 0.3) : 0}
                className="transition-all duration-500"
              />
            );
          })}

          {/* ── Line: Selected Eval → Result ── */}
          {(() => {
            const selIdx = scenario.paths.findIndex((p) => p.id === scenario.selectedPathId);
            const selCX = PATH_XS[selIdx] + PATH_W / 2;
            return (
              <path
                d={`M ${selCX} ${EVAL_Y + EVAL_R} C ${selCX} ${EVAL_Y + 50} ${RESULT_CX} ${RESULT_Y - 50} ${RESULT_CX} ${RESULT_Y}`}
                fill="none"
                stroke="#66FCF1"
                strokeWidth="1.5"
                strokeOpacity={show.result ? 0.7 : 0}
                filter="url(#reactor-glow)"
                className="transition-all duration-700"
              />
            );
          })()}

          {/* ── Goal Node ── */}
          <g className="transition-all duration-500" style={{ opacity: show.goal ? 1 : 0 }}>
            <rect
              x={GOAL_CX - GOAL_W / 2}
              y={GOAL_Y}
              width={GOAL_W}
              height={GOAL_H}
              rx={2}
              fill="#0f1828"
              stroke="#45A29E"
              strokeWidth="1"
              strokeOpacity="0.6"
            />
            <text
              x={GOAL_CX}
              y={GOAL_Y + 14}
              textAnchor="middle"
              fill="#66FCF1"
              fontSize="9"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.15em"
              fontWeight="500"
            >
              INTENTION
            </text>
            <text
              x={GOAL_CX}
              y={GOAL_Y + 28}
              textAnchor="middle"
              fill="#C5C6C7"
              fontSize="10"
              fontFamily="DM Mono, monospace"
            >
              {scenario.goalDescription}
            </text>
          </g>

          {/* ── Path Nodes ── */}
          {scenario.paths.map((path, i) => {
            const px = PATH_XS[i];
            const pathCX = px + PATH_W / 2;
            const isDenied = show.rejectionReasons && path.outcome === "denied";
            const isSelected = show.selected && path.id === scenario.selectedPathId;
            const isEval = show.eval && !show.rejectionReasons;

            return (
              <g
                key={`pn-${path.id}`}
                style={{
                  opacity: show.paths ? (isDenied && show.rejectionReasons ? 0.25 : 1) : 0,
                  transition: "opacity 0.5s ease",
                }}
              >
                <rect
                  x={px}
                  y={PATH_Y}
                  width={PATH_W}
                  height={PATH_H}
                  rx={2}
                  fill={isSelected ? "rgba(102,252,241,0.08)" : "#0d1520"}
                  stroke={isSelected ? "#66FCF1" : isEval ? "#FFB000" : "#384656"}
                  strokeWidth={isSelected ? 1.5 : 1}
                  strokeOpacity={isSelected ? 0.9 : isEval ? 0.5 : 0.5}
                />
                {isSelected && (
                  <rect
                    x={px}
                    y={PATH_Y}
                    width={PATH_W}
                    height={PATH_H}
                    rx={2}
                    fill="none"
                    stroke="#66FCF1"
                    strokeWidth="2"
                    strokeOpacity="0.3"
                    filter="url(#reactor-glow)"
                  />
                )}
                <text
                  x={pathCX}
                  y={PATH_Y + 12}
                  textAnchor="middle"
                  fill={isSelected ? "#66FCF1" : "#C5C6C7"}
                  fontSize="9"
                  fontFamily="DM Mono, monospace"
                  letterSpacing="0.05em"
                >
                  {path.label}
                </text>
                <text
                  x={pathCX}
                  y={PATH_Y + 24}
                  textAnchor="middle"
                  fill={isSelected ? "#45A29E" : "#7E8E9E"}
                  fontSize="8"
                  fontFamily="DM Mono, monospace"
                >
                  {path.sublabel}
                </text>
              </g>
            );
          })}

          {/* ── Eval Nodes ── */}
          {scenario.paths.map((path, i) => {
            const pathCX = PATH_XS[i] + PATH_W / 2;
            const isDenied = show.rejectionReasons && path.outcome === "denied";
            const isSelected = show.selected && path.id === scenario.selectedPathId;
            const isEval = show.eval;

            return (
              <g
                key={`en-${path.id}`}
                style={{
                  opacity: isEval ? 1 : 0,
                  transition: "opacity 0.4s ease",
                }}
              >
                <circle
                  cx={pathCX}
                  cy={EVAL_Y}
                  r={EVAL_R}
                  fill={isSelected ? "rgba(102,252,241,0.12)" : isDenied ? "rgba(255,46,46,0.1)" : "rgba(15,24,40,0.9)"}
                  stroke={isSelected ? "#66FCF1" : isDenied ? "#FF2E2E" : "#FFB000"}
                  strokeWidth="1"
                  strokeOpacity={isDenied ? 0.5 : isSelected ? 0.9 : 0.5}
                />
                {/* Eval pulse ring */}
                {isEval && !show.rejectionReasons && (
                  <circle
                    cx={pathCX}
                    cy={EVAL_Y}
                    r={EVAL_R + 5}
                    fill="none"
                    stroke="#FFB000"
                    strokeWidth="0.5"
                    strokeOpacity="0.25"
                    className="animate-ping"
                  />
                )}
                {/* Denied X */}
                {isDenied && (
                  <g>
                    <line
                      x1={pathCX - 5}
                      y1={EVAL_Y - 5}
                      x2={pathCX + 5}
                      y2={EVAL_Y + 5}
                      stroke="#FF2E2E"
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                    />
                    <line
                      x1={pathCX + 5}
                      y1={EVAL_Y - 5}
                      x2={pathCX - 5}
                      y2={EVAL_Y + 5}
                      stroke="#FF2E2E"
                      strokeWidth="1.5"
                      strokeOpacity="0.8"
                    />
                  </g>
                )}
                {/* Selected check */}
                {isSelected && (
                  <path
                    d={`M ${pathCX - 6} ${EVAL_Y} L ${pathCX - 2} ${EVAL_Y + 4} L ${pathCX + 6} ${EVAL_Y - 5}`}
                    fill="none"
                    stroke="#66FCF1"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#reactor-glow)"
                  />
                )}
                {/* Risk badge */}
                {isEval && !isDenied && !isSelected && (
                  <text
                    x={pathCX}
                    y={EVAL_Y + 4}
                    textAnchor="middle"
                    fill={RISK_COLORS[path.riskLevel]}
                    fontSize="7"
                    fontFamily="DM Mono, monospace"
                    letterSpacing="0.1em"
                    fontWeight="600"
                  >
                    {RISK_LABELS[path.riskLevel]}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Rejection reasons ── */}
          {scenario.paths.map((path, i) => {
            if (path.outcome !== "denied") return null;
            const pathCX = PATH_XS[i] + PATH_W / 2;
            return (
              <g
                key={`rr-${path.id}`}
                style={{
                  opacity: show.rejectionReasons ? 1 : 0,
                  transition: "opacity 0.45s ease",
                }}
              >
                <text
                  x={pathCX}
                  y={EVAL_Y + 29}
                  textAnchor="middle"
                  fill="#FF6A6A"
                  fontSize="6.5"
                  fontFamily="DM Mono, monospace"
                  letterSpacing="0.06em"
                >
                  {path.rejectionReason}
                </text>
              </g>
            );
          })}

          {/* ── Governance check ── */}
          <g
            style={{
              opacity: show.governance ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          >
            <path
              d={`M ${RESULT_CX} ${EVAL_Y + EVAL_R} C ${RESULT_CX} ${EVAL_Y + 30} ${GOVERNANCE_CX} ${GOVERNANCE_Y - 14} ${GOVERNANCE_CX} ${GOVERNANCE_Y}`}
              fill="none"
              stroke="#66FCF1"
              strokeWidth="1.2"
              strokeOpacity="0.7"
              filter="url(#reactor-glow)"
            />
            <rect
              x={GOVERNANCE_CX - GOVERNANCE_W / 2}
              y={GOVERNANCE_Y}
              width={GOVERNANCE_W}
              height={GOVERNANCE_H}
              rx={2}
              fill="rgba(15,24,40,0.92)"
              stroke="#45A29E"
              strokeWidth="1"
              strokeOpacity="0.7"
            />
            <text
              x={GOVERNANCE_CX}
              y={GOVERNANCE_Y + 11}
              textAnchor="middle"
              fill="#66FCF1"
              fontSize="8"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.18em"
              fontWeight="600"
            >
              GOVERNANCE CHECK
            </text>
            <text
              x={GOVERNANCE_CX}
              y={GOVERNANCE_Y + 21}
              textAnchor="middle"
              fill="#7E8E9E"
              fontSize="6.5"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.06em"
            >
              POLICY VERIFIED · EXECUTION AUTHORIZED
            </text>
          </g>

          {/* ── Result Badge ── */}
          <g
            style={{
              opacity: show.result ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          >
            <rect
              x={RESULT_CX - RESULT_W / 2}
              y={RESULT_Y}
              width={RESULT_W}
              height={RESULT_H}
              rx={2}
              fill="rgba(69,162,158,0.1)"
              stroke="#45A29E"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
            <rect
              x={RESULT_CX - RESULT_W / 2}
              y={RESULT_Y}
              width={RESULT_W}
              height={RESULT_H}
              rx={2}
              fill="none"
              stroke="#66FCF1"
              strokeWidth="2"
              strokeOpacity="0.2"
              filter="url(#glow-strong)"
            />
            <path
              d={`M ${GOVERNANCE_CX} ${GOVERNANCE_Y + GOVERNANCE_H} C ${GOVERNANCE_CX} ${GOVERNANCE_Y + GOVERNANCE_H + 8} ${RESULT_CX} ${RESULT_Y - 8} ${RESULT_CX} ${RESULT_Y}`}
              fill="none"
              stroke="#66FCF1"
              strokeWidth="1.5"
              strokeOpacity={show.result ? 0.7 : 0}
              filter="url(#reactor-glow)"
            />
            <text
              x={RESULT_CX}
              y={RESULT_Y + 16}
              textAnchor="middle"
              fill="#66FCF1"
              fontSize="11"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.2em"
              fontWeight="600"
            >
              APPROVED
            </text>
            <text
              x={RESULT_CX}
              y={RESULT_Y + 29}
              textAnchor="middle"
              fill="#45A29E"
              fontSize="7.5"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.12em"
            >
              RECEIPT #{scenario.receiptRef} · POLICY {scenario.policyHash}
            </text>
            <text
              x={RESULT_CX}
              y={RESULT_Y + 40}
              textAnchor="middle"
              fill="#7E8E9E"
              fontSize="6.5"
              fontFamily="DM Mono, monospace"
              letterSpacing="0.08em"
            >
              LINEAGE {scenario.lineageRef} · ANCHORED BEFORE EXECUTION
            </text>
          </g>

          {/* ── Phase Label ── */}
          <text
            x={VB_W / 2}
            y={VB_H - 12}
            textAnchor="middle"
            fill="#384656"
            fontSize="8"
            fontFamily="DM Mono, monospace"
            letterSpacing="0.1em"
          >
            {phase === "evaluating" && "EVALUATING PATHS"}
            {phase === "rejection_reasons" && "REJECTING UNSAFE PATHS"}
            {phase === "selecting" && "GOVERNING SELECTION"}
            {phase === "governance" && "VERIFYING POLICY CONSTRAINTS"}
            {(phase === "approved" || phase === "hold_result") && "COLLECTIVE OUTCOME REACHED"}
          </text>
        </svg>
      </div>

      <div
        id="collective-deep-inspection"
        className={cn(
          "relative overflow-hidden border-t border-white/[0.06] transition-[max-height,opacity] duration-300 ease-out",
          inspectionOpen ? "max-h-[840px] opacity-100" : "max-h-0 opacity-0"
        )}
        data-testid="deep-inspection-panel"
        aria-hidden={!inspectionOpen}
      >
        <div className="border-b border-white/[0.05] bg-[linear-gradient(180deg,rgba(102,252,241,0.06),rgba(6,10,16,0))] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/34">
                Governed trace
              </div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#66FCF1]">
                Deep inspection mode
              </div>
              <p className="max-w-3xl font-mono text-[11px] leading-6 text-white/60">
                Governed understanding remains anchored in causal history and reconstructable from receipts.
              </p>
            </div>
            <div className="rounded-[2px] border border-[#66FCF1]/25 bg-[#66FCF1]/8 px-3 py-2">
              <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/35">
                Selected path
              </div>
              <div className="mt-1 font-mono text-[11px] tracking-[0.06em] text-[#66FCF1]">
                {selectedPath.label} · {selectedPath.sublabel}
              </div>
              <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-white/42">
                Approved after governance check
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 px-5 py-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <section className="space-y-4">
            <div className="space-y-2 rounded-[2px] border border-white/[0.06] bg-black/15 p-4">
              <SectionTitle>Directive</SectionTitle>
              <p className="font-mono text-[12px] leading-6 text-[#EAEAEA]">{scenario.directive}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">
                {scenario.directiveSource}
              </p>
            </div>

            <div className="space-y-3 rounded-[2px] border border-white/[0.06] bg-black/15 p-4">
              <SectionTitle>Decision Path</SectionTitle>
              <div className="rounded-[2px] border border-[#66FCF1]/18 bg-[#66FCF1]/6 p-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#66FCF1]">
                  Winning path
                </div>
                <div className="mt-2 font-mono text-[12px] text-[#EAEAEA]">
                  {selectedPath.label} · {selectedPath.sublabel}
                </div>
                <p className="mt-2 font-mono text-[11px] leading-6 text-white/58">{scenario.selectedWhy}</p>
              </div>

              <div className="space-y-2">
                {rejectedPaths.map((path) => (
                  <div
                    key={path.id}
                    className="rounded-[2px] border border-[#FF2E2E]/16 bg-[#FF2E2E]/[0.03] px-3 py-2.5"
                    data-testid={`rejected-branch-${path.id}`}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FF6A6A]">
                      {path.label}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-[#EAEAEA]">{path.rejectionReason}</div>
                    <p className="mt-1 font-mono text-[10px] leading-5 text-white/48">{path.rejectionDetail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-[2px] border border-white/[0.06] bg-black/15 p-4">
              <SectionTitle>Outcome Meaning</SectionTitle>
              <p className="font-mono text-[11px] leading-6 text-white/62">{scenario.outcomeMeaning}</p>
            </div>
          </section>

          <section className="space-y-4">
            <div className="space-y-3 rounded-[2px] border border-white/[0.06] bg-black/15 p-4">
              <SectionTitle>Governance Checks</SectionTitle>
              <div className="space-y-2">
                {scenario.governanceChecks.map((check) => (
                  <div
                    key={check.label}
                    className="flex items-start gap-3 rounded-[2px] border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                  >
                    <div
                      className={cn(
                        "mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full",
                        check.status === "pass" ? "bg-[#66FCF1]" : "bg-[#FF2E2E]"
                      )}
                    />
                    <div className="space-y-1">
                      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#EAEAEA]">
                        {check.label}
                      </div>
                      <p className="font-mono text-[10px] leading-5 text-white/48">{check.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-[2px] border border-white/[0.06] bg-black/15 p-4">
                <SectionTitle>Receipt Anchors</SectionTitle>
                <div className="space-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/50">
                  <div>Receipt: <span className="text-[#66FCF1]">{scenario.receiptRef}</span></div>
                  <div>Policy hash: <span className="text-[#66FCF1]">{scenario.policyHash}</span></div>
                  <div>Correlation: <span className="text-[#66FCF1]">{scenario.correlationRef}</span></div>
                  <div>Lineage: <span className="text-[#66FCF1]">{scenario.lineageRef}</span></div>
                </div>
                <p className="font-mono text-[10px] leading-5 text-white/46">
                  Decision lineage is reconstructable from receipts.
                </p>
              </div>

              <div className="space-y-3 rounded-[2px] border border-white/[0.06] bg-black/15 p-4">
                <SectionTitle>Causal Lineage</SectionTitle>
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/44">
                  <span>Directive</span>
                  <span className="text-[#45A29E]">→</span>
                  <span>Intent</span>
                  <span className="text-[#45A29E]">→</span>
                  <span>{selectedPath.label}</span>
                  <span className="text-[#45A29E]">→</span>
                  <span>Governance</span>
                  <span className="text-[#45A29E]">→</span>
                  <span>Approval</span>
                </div>
                <p className="font-mono text-[10px] leading-5 text-white/46">
                  This approval is anchored in causal history.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Disclaimer — mandatory, always present */}
      <div
        className="relative border-t border-white/[0.06] px-5 py-2.5"
        data-testid="replay-disclaimer"
        aria-label="Example scenario disclaimer"
      >
        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-white/[0.06]" />
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/30">
            Example scenario — not from your environment
          </span>
          <div className="h-px flex-1 bg-white/[0.06]" />
        </div>
      </div>
    </div>
  );
}
