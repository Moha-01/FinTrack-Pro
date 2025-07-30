
"use client";

import React, { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { SavingsGoal, Income, Expense, RecurringPayment } from "@/types/fintrack";
import { addMonths, format } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface SavingsGoalProjectionChartProps {
  savingsGoals: SavingsGoal[];
  income: Income[];
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
}

export function SavingsGoalProjectionChart({ savingsGoals, income, expenses, recurringPayments }: SavingsGoalProjectionChartProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const { projectionData, totalTargetAmount, netMonthlySavings } = useMemo(() => {
    if (savingsGoals.length === 0) return { projectionData: [], totalTargetAmount: 0, netMonthlySavings: 0 };

    const totalMonthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyPayments = recurringPayments.reduce((sum, p) => sum + p.amount, 0);
    const netMonthlySavings = totalMonthlyIncome - (totalMonthlyExpenses + totalMonthlyPayments);

    const sortedGoals = [...savingsGoals].sort((a, b) => a.priority - b.priority);
    const totalTargetAmount = sortedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
    
    // We only consider unlinked goals' current amounts as "saved" for this projection
    let currentSavings = sortedGoals.reduce((sum, goal) => sum + (goal.linkedAccountId ? 0 : goal.currentAmount), 0);
    
    if (netMonthlySavings <= 0) {
        return { projectionData: [], totalTargetAmount, netMonthlySavings };
    }
    
    const remainingSavingsNeeded = totalTargetAmount - currentSavings;
    const monthsToGoal = Math.ceil(remainingSavingsNeeded / netMonthlySavings);
    const maxMonths = monthsToGoal > 0 ? monthsToGoal : 1;

    const data = [];
    const today = new Date();

    for (let i = 0; i <= maxMonths; i++) {
        const savedAmountForMonth = Math.min(currentSavings + (netMonthlySavings * i), totalTargetAmount)
        data.push({
            date: format(addMonths(today, i), 'MMM yyyy', { locale }),
            savedAmount: savedAmountForMonth,
        });
        if (savedAmountForMonth >= totalTargetAmount) break;
    }

    return { projectionData: data, totalTargetAmount, netMonthlySavings };
  }, [savingsGoals, income, expenses, recurringPayments, locale]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="font-bold col-span-2">{label}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'hsl(var(--chart-4))'}}/>
                {t('savingsGoalProjection.legend')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(payload[0].value)}</div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (savingsGoals.length === 0) {
    return (
       <Card>
           <CardHeader>
               <CardTitle>{t('savingsGoalProjection.title')}</CardTitle>
               <CardDescription>{t('savingsGoalProjection.description')}</CardDescription>
           </CardHeader>
           <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
               <p className="text-muted-foreground">{t('savingsGoals.noGoals')}</p>
           </CardContent>
       </Card>
   );
 }

 if (netMonthlySavings <= 0) {
     return (
       <Card>
           <CardHeader>
               <CardTitle>{t('savingsGoalProjection.title')}</CardTitle>
               <CardDescription>{t('savingsGoalProjection.description')}</CardDescription>
           </CardHeader>
           <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
               <p className="text-muted-foreground">{t('savingsGoalProjection.noSavings')}</p>
           </CardContent>
       </Card>
     )
 }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('savingsGoalProjection.title')}</CardTitle>
        <CardDescription>{t('savingsGoalProjection.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-4))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-4))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))', paddingTop: '10px'}}/>
            <Area type="monotone" dataKey="savedAmount" name={t('savingsGoalProjection.legend')} stroke="hsl(var(--chart-4))" fill="url(#colorSavings)" strokeWidth={2} dot={false} />
            <ReferenceLine y={totalTargetAmount} label={{ value: t('savingsGoals.targetAmount'), position: 'insideTopLeft' }} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
