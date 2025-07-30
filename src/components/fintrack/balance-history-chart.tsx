"use client";

import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ProfileData } from "@/types/fintrack";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDate, addDays, subDays } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface BalanceHistoryChartProps {
  profileData: ProfileData;
}

export function BalanceHistoryChart({ profileData }: BalanceHistoryChartProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const chartData = useMemo(() => {
    const { income, oneTimeIncomes, expenses, payments, oneTimePayments, currentBalance } = profileData;
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Helper to get daily transactions
    const getTransactionsForDay = (date: Date) => {
        let netChange = 0;

        // Recurring Income
        income.forEach(i => {
            if(i.recurrence === 'monthly' && getDate(parseISO(i.date)) === getDate(date)) netChange += i.amount;
            if(i.recurrence === 'yearly' && isSameDay(parseISO(i.date), date)) netChange += i.amount;
        });

        // One-Time Income
        oneTimeIncomes.forEach(i => {
            if(isSameDay(parseISO(i.date), date)) netChange += i.amount;
        });

        // Recurring Expenses
        expenses.forEach(e => {
            if(e.recurrence === 'monthly' && getDate(parseISO(e.date)) === getDate(date)) netChange -= e.amount;
            if(e.recurrence === 'yearly' && isSameDay(parseISO(e.date), date)) netChange -= e.amount;
        });

        // Recurring Payments
        payments.forEach(p => {
            const startDate = parseISO(p.date);
            const completionDate = parseISO(p.completionDate);
            if(getDate(date) === getDate(startDate) && date >= startDate && date <= completionDate) {
                 netChange -= p.amount;
            }
        });

        // One-Time Payments
        oneTimePayments.forEach(p => {
             if(isSameDay(parseISO(p.date), date) && p.status === 'paid') netChange -= p.amount;
        });

        return netChange;
    }

    // 1. Calculate balance at the start of the month by working backwards from today
    let balanceAtMonthStart = currentBalance;
    let dateIterator = today;
    // Go back to the day before the first day of the month to calculate the starting balance
    while(dateIterator >= monthStart) {
        dateIterator = subDays(dateIterator, 1);
        balanceAtMonthStart -= getTransactionsForDay(dateIterator);
    }
    
    // 2. Build daily balances moving forward
    const dailyBalances: { day: string, balance: number, hasChange: boolean }[] = [];
    let runningBalance = balanceAtMonthStart;

    for (const day of daysInMonth) {
        const netChange = getTransactionsForDay(day);
        runningBalance += netChange;
        
        const hasChange = netChange !== 0;

        dailyBalances.push({
            day: format(day, 'd'),
            balance: runningBalance,
            hasChange,
        });
    }
    
    return dailyBalances;

  }, [profileData, language]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value !== undefined) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="font-bold col-span-2">{t('balanceHistoryChart.day')} {label}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'hsl(var(--chart-1))'}}/>
                {t('summary.currentBalance')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(payload[0].value)}</div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('balanceHistoryChart.title', { month: format(new Date(), 'MMMM', { locale }) })}</CardTitle>
        <CardDescription>{t('balanceHistoryChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} domain={['dataMin - 1000', 'dataMax + 1000']} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Bar dataKey="balance" name={t('summary.currentBalance')} radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.hasChange ? 'hsl(var(--chart-1))' : 'hsl(var(--muted))'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
