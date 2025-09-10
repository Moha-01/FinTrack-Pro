
"use client";

import React, { useMemo } from "react";
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, OneTimeIncome } from "@/types/fintrack";
import { useSettings } from "@/hooks/use-settings";

interface IncomeBreakdownChartProps {
  income: Income[];
  oneTimeIncomes: OneTimeIncome[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-5))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-4))',
];

const CustomTooltipContent = ({ active, payload }: any) => {
  const { formatCurrency } = useSettings();
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 items-center gap-x-2 gap-y-1">
          <div className="font-bold col-span-2 capitalize">{data.name}</div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: payload[0].fill }} />
            {data.type === 'oneTime' ? 'Einmalig' : 'Monatlich'}
          </div>
          <div className="text-sm font-mono text-right">{formatCurrency(data.value)}</div>
        </div>
      </div>
    );
  }
  return null;
};

export function IncomeBreakdownChart({ income, oneTimeIncomes }: IncomeBreakdownChartProps) {
  const { t, formatCurrency } = useSettings();

  const { chartData, totalIncome } = useMemo(() => {
    const monthlySources = income.map(i => ({
      name: i.source,
      value: i.recurrence === 'monthly' ? i.amount : i.amount / 12,
      type: 'recurring'
    }));

    // For this chart, we'll consider one-time incomes as part of the monthly total
    const oneTimeSources = oneTimeIncomes.map(i => ({
      name: i.source,
      value: i.amount,
      type: 'oneTime'
    }));

    const allSources = [...monthlySources, ...oneTimeSources];

    const aggregated = allSources.reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.value += item.value;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, [] as { name: string; value: number, type: string }[]);
    
    const total = aggregated.reduce((sum, item) => sum + item.value, 0);

    return { chartData: aggregated, totalIncome: total };
  }, [income, oneTimeIncomes]);
  

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('incomeBreakdownChart.title')}</CardTitle>
          <CardDescription>{t('incomeBreakdownChart.description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
          <p className="text-muted-foreground">{t('incomeBreakdownChart.noData')}</p>
        </CardContent>
      </Card>
    );
  }
  
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs font-bold">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
  };


  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('incomeBreakdownChart.title')}</CardTitle>
        <CardDescription>{t('incomeBreakdownChart.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center justify-center gap-4 -mt-4">
        <div className="w-full h-[250px] sm:h-[300px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Tooltip content={<CustomTooltipContent />} />
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius="80%"
                    innerRadius="50%"
                    dataKey="value"
                    nameKey="name"
                >
                    {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="focus:outline-none"/>
                    ))}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
        </div>
        <div className="w-full sm:w-auto flex-1 sm:max-w-[200px]">
            <div className="space-y-2 text-sm">
                <div className="font-semibold text-lg border-b pb-2 mb-2">{t('incomeBreakdownChart.totalIncome')}: {formatCurrency(totalIncome)}</div>
                {chartData.map((entry, index) => (
                    <div key={`legend-${index}`} className="flex items-center justify-between">
                       <div className="flex items-center gap-2 truncate">
                         <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                         <span className="truncate">{entry.name}</span>
                       </div>
                       <span className="font-mono">{formatCurrency(entry.value)}</span>
                    </div>
                ))}
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
