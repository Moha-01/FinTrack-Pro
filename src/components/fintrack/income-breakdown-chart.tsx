
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income } from "@/types/fintrack";
import { useMemo } from "react";
import { useSettings } from "@/hooks/use-settings";

interface IncomeBreakdownChartProps {
  income: Income[];
}

const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

const CustomTooltip = ({ active, payload }: any) => {
    const { formatCurrency, t } = useSettings();
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 items-center gap-x-2 gap-y-1">
             <div className="font-bold col-span-2 capitalize">{data.name}</div>
             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: payload[0].fill}}/>
                {t('common.amount')}
             </div>
             <div className="text-sm font-mono text-right">{formatCurrency(data.value)}</div>
          </div>
        </div>
      );
    }
    return null;
};

export function IncomeBreakdownChart({ income }: IncomeBreakdownChartProps) {
  const { t, formatCurrency } = useSettings();

  const chartData = useMemo(() => {
    const incomeData = income.map(i => ({
      name: i.source,
      value: i.recurrence === 'monthly' ? i.amount : i.amount / 12,
    }));
    
    return incomeData.sort((a,b) => b.value - a.value);

  }, [income]);

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

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
    if (percent * 100 < 5) return null;

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

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
            <Legend iconType="circle" />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={110}
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
