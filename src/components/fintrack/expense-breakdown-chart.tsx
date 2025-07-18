"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Expense, RecurringPayment } from "@/types/fintrack";
import { useMemo } from "react";

interface ExpenseBreakdownChartProps {
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
];

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

export function ExpenseBreakdownChart({ expenses, recurringPayments }: ExpenseBreakdownChartProps) {
  const chartData = useMemo(() => {
    const expenseData = expenses.map(e => ({
      name: e.category,
      value: e.recurrence === 'monthly' ? e.amount : e.amount / 12,
    }));

    const paymentData = recurringPayments.map(p => ({
      name: p.name,
      value: p.amount,
    }));

    const combinedData = [...expenseData, ...paymentData];

    // Aggregate data by name/category
    const aggregatedData = combinedData.reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.value += item.value;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
    
    return aggregatedData.sort((a,b) => b.value - a.value);

  }, [expenses, recurringPayments]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Monthly Expense Breakdown</CardTitle>
                <CardDescription>A breakdown of your monthly spending.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[250px]">
                <p className="text-muted-foreground">No expense data available.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Expense Breakdown</CardTitle>
        <CardDescription>A breakdown of your monthly spending.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => [formatCurrency(value), name]}
            />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconSize={10}
              wrapperStyle={{
                fontSize: "12px",
                lineHeight: "20px"
              }}
              formatter={(value, entry) => {
                 const { color } = entry;
                 return <span style={{ color }}>{value}</span>;
              }}
            />
            <Pie
              data={chartData}
              cx="40%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              stroke="hsl(var(--background))"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                if (percent < 0.05) return null;
                return (
                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                    {`${(percent * 100).toFixed(0)}%`}
                  </text>
                );
              }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
