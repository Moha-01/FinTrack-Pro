
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Expense, RecurringPayment } from "@/types/fintrack";
import { useMemo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSettings } from "@/hooks/use-settings";

interface ExpenseBreakdownChartProps {
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload, label }: any) => {
    const { formatCurrency, t } = useSettings();
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 items-center gap-x-2 gap-y-1">
             <div className="font-bold col-span-2 capitalize">{label}</div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: payload[0].fill}}/>
                {t('common.amount')}
             </div>
             <div className="text-sm font-mono text-right">{formatCurrency(payload[0].value)}</div>
          </div>
        </div>
      );
    }
    return null;
};


export function ExpenseBreakdownChart({ expenses, recurringPayments }: ExpenseBreakdownChartProps) {
  const isMobile = useIsMobile();
  const { t, currency } = useSettings();

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
                <CardTitle>{t('expenseChart.title')}</CardTitle>
                <CardDescription>{t('expenseChart.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <p className="text-muted-foreground">{t('expenseChart.noData')}</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('expenseChart.title')}</CardTitle>
        <CardDescription>{t('expenseChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300 + chartData.length * 10}>
          <BarChart 
            data={chartData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}${currency === 'EUR' ? '€' : currency === 'USD' ? '$' : '£'}`} />
            <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} width={isMobile ? 60 : 100} tick={{ textAnchor: 'end', textTransform: 'capitalize' }} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} name={t('common.amount')}>
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
