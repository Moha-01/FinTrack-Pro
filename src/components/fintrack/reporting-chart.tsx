"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, Expense, RecurringPayment } from "@/types/fintrack";
import { useMemo } from "react";

interface ReportingChartProps {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
}

export function ReportingChart({ income, expenses, payments }: ReportingChartProps) {
  const chartData = useMemo(() => {
    const totalAnnualIncome = income.reduce((acc, item) => acc + (item.recurrence === 'monthly' ? item.amount * 12 : item.amount), 0);
    const totalAnnualExpenses = expenses.reduce((acc, item) => acc + (item.recurrence === 'monthly' ? item.amount * 12 : item.amount), 0);
    const totalAnnualPayments = payments.reduce((acc, item) => acc + (item.amount * 12), 0);

    return [
      { name: "Income", total: totalAnnualIncome, fill: "var(--color-income)" },
      { name: "Expenses", total: totalAnnualExpenses + totalAnnualPayments, fill: "var(--color-expenses)" },
    ];
  }, [income, expenses, payments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial Report</CardTitle>
        <CardDescription>An overview of your annual income and expenses.</CardDescription>
      </CardHeader>
      <CardContent>
        <style>{`
          :root {
            --color-income: hsl(var(--chart-1));
            --color-expenses: hsl(var(--chart-2));
          }
        `}</style>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Bar dataKey="total" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
