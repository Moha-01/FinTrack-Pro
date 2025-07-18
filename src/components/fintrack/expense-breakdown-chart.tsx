"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Expense, RecurringPayment } from "@/types/fintrack";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface ExpenseBreakdownChartProps {
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

export function ExpenseBreakdownChart({ expenses, recurringPayments }: ExpenseBreakdownChartProps) {
  const isMobile = useIsMobile();
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

    const aggregatedData = combinedData.reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.value += item.value;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as { name: string; value: number }[]);
    
    return aggregatedData.sort((a,b) => a.value - b.value);

  }, [expenses, recurringPayments]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Aufschlüsselung der monatlichen Ausgaben</CardTitle>
                <CardDescription>Eine Aufschlüsselung Ihrer monatlichen Ausgaben.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <p className="text-muted-foreground">Keine Ausgabendaten verfügbar.</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aufschlüsselung der monatlichen Ausgaben</CardTitle>
        <CardDescription>Eine Aufschlüsselung Ihrer monatlichen Ausgaben.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300 + chartData.length * 10}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}€`} />
            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={isMobile ? 60 : 100} tick={{ textAnchor: 'end' }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
                color: 'hsl(var(--foreground))'
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', textTransform: 'capitalize' }}
              formatter={(value: number) => [formatCurrency(value), 'Betrag']}
            />
            <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} name="Betrag" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
