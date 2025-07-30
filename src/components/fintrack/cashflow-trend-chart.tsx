
"use client";

import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, Expense, RecurringPayment, OneTimePayment, OneTimeIncome } from "@/types/fintrack";
import { subMonths, format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface CashflowTrendChartProps {
  income: Income[];
  oneTimeIncomes: OneTimeIncome[];
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

export function CashflowTrendChart({ income, oneTimeIncomes, expenses, recurringPayments, oneTimePayments }: CashflowTrendChartProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    const baseMonthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const baseMonthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);

    for (let i = 11; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      let totalIncomeForMonth = baseMonthlyIncome;
      let totalExpensesForMonth = baseMonthlyExpenses;

      const dueOneTimeIncomes = oneTimeIncomes.filter(inc => {
        const incomeDate = parseISO(inc.date);
        return isWithinInterval(incomeDate, { start: monthStart, end: monthEnd });
      });
      totalIncomeForMonth += dueOneTimeIncomes.reduce((sum, inc) => sum + inc.amount, 0);


      const activeRecurring = recurringPayments.filter(p => {
        const startDate = parseISO(p.date);
        const completionDate = parseISO(p.completionDate);
        return isWithinInterval(monthStart, { start: startDate, end: completionDate }) || isWithinInterval(monthEnd, { start: startDate, end: completionDate });
      });
      totalExpensesForMonth += activeRecurring.reduce((sum, p) => sum + p.amount, 0);

      const dueOneTimePayments = oneTimePayments.filter(p => {
        const dueDate = parseISO(p.date);
        return isWithinInterval(dueDate, { start: monthStart, end: monthEnd });
      });
      totalExpensesForMonth += dueOneTimePayments.reduce((sum, p) => sum + p.amount, 0);

      data.push({
        name: format(monthDate, 'MMM yy', { locale: locale }),
        income: totalIncomeForMonth,
        expenses: totalExpensesForMonth,
      });
    }
    return data;
  }, [income, oneTimeIncomes, expenses, recurringPayments, oneTimePayments, locale]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeValue = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expensesValue = payload.find((p: any) => p.dataKey === 'expenses')?.value || 0;
      const net = incomeValue - expensesValue;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="font-bold col-span-2">{label}</div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'hsl(var(--chart-2))'}}/>
                {t('common.income')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(incomeValue)}</div>

             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'hsl(var(--chart-3))'}}/>
                {t('common.expenses')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(expensesValue)}</div>

            <div className="col-span-2 border-t mt-1 pt-1"></div>

             <div className="flex items-center gap-2 text-sm font-semibold">
                {t('cashflowChart.net')}
            </div>
            <div className={`text-sm font-mono text-right font-semibold ${net >= 0 ? 'text-positive' : 'text-negative'}`}>{formatCurrency(net)}</div>

          </div>
        </div>
      );
    }
    return null;
  };

  if (!income.length && !expenses.length && !recurringPayments.length) {
     return (
        <Card>
            <CardHeader>
                <CardTitle>{t('cashflowChart.title')}</CardTitle>
                <CardDescription>{t('cashflowChart.description')}</CardDescription>
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
        <CardTitle>{t('cashflowChart.title')}</CardTitle>
        <CardDescription>{t('cashflowChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Legend iconType="circle" wrapperStyle={{color: 'hsl(var(--muted-foreground))', paddingTop: '10px'}}/>
            <Bar dataKey="income" fill="hsl(var(--chart-2))" name={t('common.income')} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" fill="hsl(var(--chart-3))" name={t('common.expenses')} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
