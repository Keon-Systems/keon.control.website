"use client";
import * as React from "react";
import { formatCurrency } from "@/lib/format";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface SpendByService {
  service: string;
  spend?: number;
  spendUsd?: number;
}

interface AzureSpendChartProps {
  data: SpendByService[];
  totalSpend?: number;
  budgetAmount?: number;
}

export function AzureSpendChart({ data, totalSpend, budgetAmount }: AzureSpendChartProps) {
  const chartData = data.map((item) => ({
    service: item.service,
    spend: item.spend ?? item.spendUsd ?? 0,
  }));

  return (
    <div className="space-y-4">
      {(totalSpend !== undefined || budgetAmount !== undefined) && (
        <div className="flex gap-6">
          {totalSpend !== undefined && (
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Total Spend</p>
              <p className="font-mono text-xl font-bold text-[#66FCF1]">{formatCurrency(totalSpend)}</p>
            </div>
          )}
          {budgetAmount !== undefined && (
            <div>
              <p className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60">Budget</p>
              <p className="font-mono text-xl font-bold text-[#C5C6C7]">{formatCurrency(budgetAmount)}</p>
            </div>
          )}
        </div>
      )}
      <div className="h-48">
        <p className="font-mono text-xs uppercase tracking-wide text-[#C5C6C7] opacity-60 mb-2">
          Azure Spend by Service
        </p>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <XAxis
              dataKey="service"
              tick={{ fill: "#C5C6C7", fontSize: 10, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "#384656" }}
            />
            <YAxis
              tick={{ fill: "#C5C6C7", fontSize: 10, fontFamily: "monospace" }}
              tickLine={false}
              axisLine={{ stroke: "#384656" }}
              tickFormatter={(v) => formatCurrency(v as number)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2833",
                border: "1px solid #384656",
                borderRadius: 0,
                fontFamily: "monospace",
                fontSize: 12,
                color: "#C5C6C7",
              }}
              formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Spend"]}
            />
            <Bar dataKey="spend" radius={0}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? "#66FCF1" : "#384656"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
