"use client";

import { useFinancial } from "@/hooks/useFinancial";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Label,
} from "recharts";

const COLORS = [
  "#10b981",
  "#8b5cf6",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export function FinancialCharts() {
  const { data, totalRevenue, totalCosts } = useFinancial();

  const revenueData = (data?.revenues ?? []).map((r) => ({
    name: r.category,
    value: r.amount,
  }));
  const costData = (data?.costs ?? []).map((c) => ({
    name: c.category,
    value: c.amount,
  }));
  // For a clear visual compare, use totals (categories do not match between revenue and costs)
  const combinedTotals = [
    { name: "Totals", revenue: totalRevenue, cost: totalCosts },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Revenue Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={Object.fromEntries(
              revenueData.map((d, i) => [
                d.name,
                { label: d.name, color: COLORS[i % COLORS.length] },
              ])
            )}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={revenueData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {revenueData.map((_, index) => (
                    <Cell
                      key={`rev-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                  <Label
                    position="center"
                    value={formatCurrency(totalRevenue)}
                  />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Cost Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={Object.fromEntries(
              costData.map((d, i) => [
                d.name,
                { label: d.name, color: COLORS[i % COLORS.length] },
              ])
            )}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={costData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {costData.map((_, index) => (
                    <Cell
                      key={`cost-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                  <Label position="center" value={formatCurrency(totalCosts)} />
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Revenue vs Cost</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              revenue: { label: "Revenue", color: "#10b981" },
              cost: { label: "Cost", color: "#ef4444" },
            }}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={combinedTotals}>
                <XAxis dataKey="name" hide />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <ChartLegend content={<ChartLegendContent />} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
                <Bar dataKey="cost" fill="#ef4444" name="Cost" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
