
"use client";

import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ProfileData, Transaction } from "@/types/fintrack";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDate, subDays, getDaysInMonth, isWithinInterval } from "date-fns";
import { de, enUS, ar } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface BalanceHistoryChartProps {
  profileData: ProfileData;
}

export function BalanceHistoryChart({ profileData }: BalanceHistoryChartProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : language === 'ar' ? ar : enUS;

  const chartData = useMemo(() => {
    const { transactions, currentBalance } = profileData;
    const today = new Date();
    
    // Determine the month to display. For now, it's always the current month.
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Helper to get daily net change for any given day
    const getNetChangeForDay = (date: Date): number => {
        let netChange = 0;
        
        transactions.forEach(t => {
            const transactionDate = parseISO(t.date);
            let affectsBalance = false;

            if (t.recurrence === 'once') {
                if (isSameDay(transactionDate, date)) {
                    // Paid one-time incomes and pending one-time payments
                    if (t.category === 'income' || (t.category === 'payment' && t.status === 'pending') || (t.category === 'expense' && t.status === 'pending')) {
                        affectsBalance = true;
                    }
                }
            } else if (t.recurrence === 'monthly') {
                if (getDate(transactionDate) === getDate(date)) {
                     if (t.category === 'payment' && t.installmentDetails) {
                         if (isWithinInterval(date, { start: transactionDate, end: parseISO(t.installmentDetails.completionDate)})) {
                             affectsBalance = true;
                         }
                     } else {
                         affectsBalance = true;
                     }
                }
            } else if (t.recurrence === 'yearly') {
                if (isSameDay(transactionDate, date)) {
                     affectsBalance = true;
                }
            }

            if (affectsBalance) {
                if(t.category === 'income') {
                    netChange += t.amount;
                } else {
                    netChange -= t.amount;
                }
            }
        });

        return netChange;
    }
    
    // Calculate balance at start of the month by rolling back from today's balance
    let balanceAtMonthStart = currentBalance;
    const daysFromTodayToMonthStart = eachDayOfInterval({ start: monthStart, end: subDays(today,1) });
    
    // Subtract net changes from today back to the start of the month
    for (const day of [...daysFromTodayToMonthStart, subDays(today,1)].reverse()) {
        balanceAtMonthStart -= getNetChangeForDay(day);
    }
    balanceAtMonthStart -= getNetChangeForDay(today);


    const dailyData: { day: string, balance: number, hasChange: boolean }[] = [];
    let runningBalance = balanceAtMonthStart;

    for (const day of daysInMonth) {
        if (!isSameDay(day, monthStart)) {
           runningBalance += getNetChangeForDay(subDays(day,1));
        }
        
        const netChange = getNetChangeForDay(day);
        const hasChange = netChange !== 0;

        dailyData.push({
            day: format(day, 'd'),
            balance: runningBalance + (isSameDay(day, today) ? netChange : 0),
            hasChange,
        });

        if (isSameDay(day, today)) {
          break; // Stop after today
        }
    }
    
    return dailyData;

  }, [profileData, language, t]);

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
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
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
