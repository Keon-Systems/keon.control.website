import * as React from "react";

export function StepShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="space-y-4 border-b border-white/10 pb-6">
        <div className="font-mono text-xs uppercase tracking-[0.26em] text-[#7EE8E0]">{eyebrow}</div>
        <div className="space-y-3">
          <h1 className="max-w-3xl font-display text-4xl font-semibold leading-tight text-white sm:text-5xl">{title}</h1>
          <p className="max-w-2xl text-base leading-7 text-white/72 sm:text-lg">{description}</p>
        </div>
      </div>
      <div className="space-y-6">{children}</div>
      {footer ? <div className="pt-2">{footer}</div> : null}
    </div>
  );
}
