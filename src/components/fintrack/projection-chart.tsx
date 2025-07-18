"use client";

import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Income, Expense, RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { useMemo } from "react";
import { addMonths, format, isAfter, isSameDay, parseISO, startOfMonth } from "date-fns";
import { de } from 'date-fns/locale';

interface ProjectionChartProps {
  currentBalance: number;
  income: Income[];
  expenses: Expense[];
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

export function ProjectionChart({ currentBalance, income, expenses, recurringPayments, oneTimePayments }: ProjectionChartProps) {
  const projectionData = useMemo(() => {
    const data = [];
    let balance = currentBalance;
    const today = new Date();

    const monthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const monthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    
    for (let i = 0; i < 60; i++) { // Project 5 years into the future
      const futureDate = addMonths(today, i);
      const futureMonthStart = startOfMonth(futureDate);

      let netChange = monthlyIncome - monthlyExpenses;

      const activeRecurring = recurringPayments.filter(p => {
          const startDate = parseISO(p.startDate);
          const completionDate = parseISO(p.completionDate);
          return isAfter(futureMonthStart, startDate) && !isAfter(futureMonthStart, completionDate);
      });
      netChange -= activeRecurring.reduce((sum, p) => sum + p.amount, 0);

      const dueOneTimePayments = oneTimePayments.filter(p => {
        const dueDate = parseISO(p.dueDate);
        return dueDate.getFullYear() === futureDate.getFullYear() && dueDate.getMonth() === futureDate.getMonth();
      });
      netChange -= dueOneTimePayments.reduce((sum, p) => sum + p.amount, 0);

      balance += netChange;

      data.push({
        date: format(futureDate, 'MMM yyyy', { locale: de }),
        balance: balance,
      });
    }

    return data;
  }, [currentBalance, income, expenses, recurringPayments, oneTimePayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>5-Jahres-Finanzprognose</CardTitle>
        <CardDescription>Geschätzte Kontostandsentwicklung im Zeitverlauf.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <XAxis dataKey="date" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)} Tsd. €`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{
                background: 'hsl(var(--background))',
                borderRadius: 'var(--radius)',
                border: '1px solid hsl(var(--border))',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value)}
            />
            <Legend formatter={() => 'Prognostizierter Kontostand'}/>
            <Line type="monotone" dataKey="balance" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Prognostizierter Kontostand" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
