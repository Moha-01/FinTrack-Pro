"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, OneTimeIncome } from "@/types/fintrack";
import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";
import { subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";


interface IncomeBreakdownChartProps {
  income: Income[];
  oneTimeIncomes: OneTimeIncome[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload }: any) => {
    const { formatCurrency } = useSettings();
    if (active && payload && payload.length) {
      const { name, value, percent } = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 items-center gap-x-2 gap-y-1">
             <div className="font-bold col-span-2 capitalize">{name}</div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: payload[0].fill}}/>
                {formatCurrency(value)}
             </div>
             <div className="text-sm font-mono text-right col-start-2">({(percent * 100).toFixed(0)}%)</div>
          </div>
        </div>
      );
    }
    return null;
};


export function IncomeBreakdownChart({ income, oneTimeIncomes }: IncomeBreakdownChartProps) {
  const { t } = useSettings();

  const chartData = useMemo(() => {
    const recurringIncomeData = income.map(i => ({
      name: i.source,
      value: i.recurrence === 'monthly' ? i.amount : i.amount / 12,
    }));
    
    const today = new Date();
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));

    const oneTimeIncomeData = oneTimeIncomes
        .filter(i => isWithinInterval(parseISO(i.date), { start: lastMonthStart, end: lastMonthEnd }))
        .map(i => ({
            name: i.source,
            value: i.amount
        }));

    const combinedData = [...recurringIncomeData, ...oneTimeIncomeData];

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

  }, [income, oneTimeIncomes]);

  if (chartData.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('incomeChart.title')}</CardTitle>
                <CardDescription>{t('incomeChart.description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
                <p className="text-muted-foreground">{t('incomeChart.noData')}</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('incomeChart.title')}</CardTitle>
        <CardDescription>{t('incomeChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ paddingTop: '20px', color: 'hsl(var(--muted-foreground))' }}
                />
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
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
