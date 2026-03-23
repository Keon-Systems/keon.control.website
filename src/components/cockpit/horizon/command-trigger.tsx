"use client";

/**
 * Command Trigger — Ctrl+K badge.
 * Opens the command palette.
 */

interface CommandTriggerProps {
  onOpen: () => void;
}

export function CommandTrigger({ onOpen }: CommandTriggerProps) {
  return (
    <button
      onClick={onOpen}
      className="flex items-center gap-1 rounded border border-[#1F2833]/40 px-1.5 py-0.5 ml-2 shrink-0 hover:border-[#45A29E]/40 transition-colors"
      title="Command Palette (Ctrl+K)"
    >
      <span className="text-[9px] font-mono text-[#C5C6C7]/30">⌘K</span>
    </button>
  );
}

