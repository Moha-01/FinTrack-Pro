
"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, Expense, RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { useMemo } from "react";
import { addMonths, format, isAfter, parseISO, startOfMonth } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface ProjectionChartProps {
  currentBalance: number;
  income: Income[];
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

export function ProjectionChart({ currentBalance, income, expenses, recurringPayments, oneTimePayments }: ProjectionChartProps) {
  const { t, language, currency, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;
  
  const projectionData = useMemo(() => {
    const data = [];
    let balance = currentBalance;
    let cumulativeIncome = 0;
    let cumulativeExpenses = 0;
    const today = new Date();

    const monthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const monthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    
    for (let i = 0; i < 60; i++) { // Project 5 years into the future
      const futureDate = addMonths(today, i);
      const futureMonthStart = startOfMonth(futureDate);

      let currentMonthExpenses = monthlyExpenses;
      
      const activeRecurring = recurringPayments.filter(p => {
          const startDate = typeof p.startDate === 'string' ? parseISO(p.startDate) : p.startDate;
          const completionDate = typeof p.completionDate === 'string' ? parseISO(p.completionDate) : p.completionDate;
          return isAfter(futureMonthStart, startDate) && !isAfter(futureMonthStart, completionDate);
      });
      currentMonthExpenses += activeRecurring.reduce((sum, p) => sum + p.amount, 0);

      const dueOneTimePayments = oneTimePayments.filter(p => {
        const dueDate = typeof p.dueDate === 'string' ? parseISO(p.dueDate) : p.dueDate;
        return dueDate.getFullYear() === futureDate.getFullYear() && dueDate.getMonth() === futureDate.getMonth();
      });
      currentMonthExpenses += dueOneTimePayments.reduce((sum, p) => sum + p.amount, 0);

      const netChange = monthlyIncome - currentMonthExpenses;
      balance += netChange;
      cumulativeIncome += monthlyIncome;
      cumulativeExpenses += currentMonthExpenses;

      data.push({
        date: format(futureDate, 'MMM yyyy', { locale: locale }),
        balance: balance,
        income: cumulativeIncome,
        expenses: cumulativeExpenses,
      });
    }

    return data;
  }, [currentBalance, income, expenses, recurringPayments, oneTimePayments, locale]);
  
  const legendPayload = [
    { value: t('projectionChart.legendBalance'), type: 'line', color: 'hsl(var(--chart-1))' },
    { value: t('projectionChart.legendIncome'), type: 'line', color: 'hsl(var(--chart-2))' },
    { value: t('projectionChart.legendExpenses'), type: 'line', color: 'hsl(var(--chart-3))' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectionChart.title')}</CardTitle>
        <CardDescription>{t('projectionChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                const legendEntry = legendPayload.find(item => item.value === name) || {};
                return [formatCurrency(value), legendEntry.value];
              }}
            />
            <Legend payload={legendPayload} wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
            <Line type="monotone" dataKey="balance" name={t('projectionChart.legendBalance')} stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="income" name={t('projectionChart.legendIncome')} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" name={t('projectionChart.legendExpenses')} stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
