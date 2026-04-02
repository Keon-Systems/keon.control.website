"use client";

import { Card, CardContent, CardHeader } from "@/components/layout/page-container";

export function DoctrineExplainer({
  title,
  description,
  points,
}: {
  title: string;
  description: string;
  points: { label: string; detail: string }[];
}) {
  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardContent className="space-y-3">
        {points.map((point) => (
          <div key={point.label} className="rounded border border-[#384656] bg-[#0B0C10] p-4">
            <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#66FCF1]">
              {point.label}
            </div>
            <p className="mt-2 font-mono text-sm leading-6 text-[#C5C6C7] opacity-80">{point.detail}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
