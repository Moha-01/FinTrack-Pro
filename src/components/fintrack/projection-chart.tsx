
"use client";

import React, { useMemo } from "react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, Expense, RecurringPayment, OneTimePayment, OneTimeIncome } from "@/types/fintrack";
import { addMonths, format, isAfter, parseISO, startOfMonth, isSameMonth } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface ProjectionChartProps {
  currentBalance: number;
  income: Income[];
  oneTimeIncomes: OneTimeIncome[];
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

export function ProjectionChart({ currentBalance, income, oneTimeIncomes, expenses, recurringPayments, oneTimePayments }: ProjectionChartProps) {
  const { t, language, formatCurrency } = useSettings();
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

      let currentMonthIncome = monthlyIncome;
      let currentMonthExpenses = monthlyExpenses;
      
      const dueOneTimeIncomes = oneTimeIncomes.filter(inc => {
        const incomeDate = parseISO(inc.date);
        return isSameMonth(incomeDate, futureDate);
      });
      currentMonthIncome += dueOneTimeIncomes.reduce((sum, p) => sum + p.amount, 0);

      const activeRecurring = recurringPayments.filter(p => {
          const startDate = parseISO(p.date);
          const completionDate = parseISO(p.completionDate);
          return isAfter(futureMonthStart, startDate) && !isAfter(futureMonthStart, completionDate);
      });
      currentMonthExpenses += activeRecurring.reduce((sum, p) => sum + p.amount, 0);

      const dueOneTimePayments = oneTimePayments.filter(p => {
        const dueDate = parseISO(p.date);
        return isSameMonth(dueDate, futureDate);
      });
      currentMonthExpenses += dueOneTimePayments.reduce((sum, p) => sum + p.amount, 0);

      const netChange = currentMonthIncome - currentMonthExpenses;
      balance += netChange;
      cumulativeIncome += currentMonthIncome;
      cumulativeExpenses += currentMonthExpenses;

      data.push({
        date: format(futureDate, 'MMM yyyy', { locale: locale }),
        balance: balance,
        income: cumulativeIncome,
        expenses: cumulativeExpenses,
      });
    }

    return data;
  }, [currentBalance, income, oneTimeIncomes, expenses, recurringPayments, oneTimePayments, locale]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="font-bold col-span-2">{label}</div>
            {payload.map((p: any) => (
                <React.Fragment key={p.dataKey}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: p.color}}/>
                        {p.name}
                    </div>
                    <div className="text-sm font-mono text-right">{formatCurrency(p.value)}</div>
                </React.Fragment>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('projectionChart.title')}</CardTitle>
        <CardDescription>{t('projectionChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
            <Line type="monotone" dataKey="balance" name={t('projectionChart.legend.balance')} stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="income" name={t('projectionChart.legend.income')} stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="expenses" name={t('projectionChart.legend.expenses')} stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
