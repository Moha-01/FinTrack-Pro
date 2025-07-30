
"use client";

import React, { useMemo } from "react";
import { Bar, Line, ComposedChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, Expense, RecurringPayment, OneTimePayment, OneTimeIncome } from "@/types/fintrack";
import { addYears, format, parseISO, startOfYear, endOfYear, isWithinInterval } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";
import { Separator } from "../ui/separator";

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
    const today = new Date();

    const yearlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount : item.amount * 12), 0);
    const yearlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount : item.amount * 12), 0);
    
    for (let i = 0; i < 10; i++) { // Project 10 years into the future
      const futureYearDate = addYears(today, i);
      const yearStart = startOfYear(futureYearDate);
      const yearEnd = endOfYear(futureYearDate);

      let currentYearIncome = yearlyIncome;
      let currentYearExpenses = yearlyExpenses;
      
      const dueOneTimeIncomes = oneTimeIncomes.filter(inc => {
        const incomeDate = parseISO(inc.date);
        return isWithinInterval(incomeDate, { start: yearStart, end: yearEnd });
      });
      currentYearIncome += dueOneTimeIncomes.reduce((sum, p) => sum + p.amount, 0);

      const monthlyPaymentsInYear = recurringPayments.reduce((sum, p) => {
          const startDate = parseISO(p.date);
          const endDate = parseISO(p.completionDate);
          let months = 0;
          for(let m = 0; m < 12; m++) {
              const d = new Date(yearStart.getFullYear(), m, 1);
              if(isWithinInterval(d, {start: startDate, end: endDate})) {
                  months++;
              }
          }
          return sum + (p.amount * months);
      }, 0);
      currentYearExpenses += monthlyPaymentsInYear;


      const dueOneTimePayments = oneTimePayments.filter(p => {
        const dueDate = parseISO(p.date);
        return isWithinInterval(dueDate, { start: yearStart, end: yearEnd });
      });
      currentYearExpenses += dueOneTimePayments.reduce((sum, p) => sum + p.amount, 0);

      const netChange = currentYearIncome - currentYearExpenses;
      balance += netChange;

      data.push({
        date: format(futureYearDate, 'yyyy', { locale: locale }),
        income: currentYearIncome,
        expenses: currentYearExpenses,
        balance: balance,
      });
    }

    return data;
  }, [currentBalance, income, oneTimeIncomes, expenses, recurringPayments, oneTimePayments, locale]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const incomeVal = payload.find(p => p.dataKey === 'income')?.value || 0;
      const expensesVal = payload.find(p => p.dataKey === 'expenses')?.value || 0;
      const balanceVal = payload.find(p => p.dataKey === 'balance')?.value || 0;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="font-bold col-span-2">{label}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full bg-positive"/>
                {t('common.income')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(incomeVal)}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full bg-negative"/>
                {t('common.expenses')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(expensesVal)}</div>
            <Separator className="col-span-2 my-1"/>
            <div className="flex items-center gap-2 text-sm font-semibold">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'hsl(var(--chart-3))'}}/>
                {t('projectionChart.legend.balance')}
            </div>
            <div className="text-sm font-mono font-semibold text-right">{formatCurrency(balanceVal)}</div>
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
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={projectionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Legend iconType="circle" wrapperStyle={{color: 'hsl(var(--muted-foreground))', paddingTop: '10px'}}/>
            <Bar dataKey="income" barSize={20} fill="hsl(var(--positive))" name={t('common.income')} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" barSize={20} fill="hsl(var(--negative))" name={t('common.expenses')} radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="balance" stroke="hsl(var(--chart-3))" strokeWidth={2} name={t('projectionChart.legend.balance')} />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

    