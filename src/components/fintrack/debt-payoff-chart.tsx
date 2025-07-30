
"use client";

import React, { useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { RecurringPayment } from "@/types/fintrack";
import { addMonths, format, isAfter, parseISO, startOfMonth, max, differenceInMonths } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { useSettings } from "@/hooks/use-settings";

interface DebtPayoffChartProps {
  recurringPayments: RecurringPayment[];
}

export function DebtPayoffChart({ recurringPayments }: DebtPayoffChartProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;
  
  const projectionData = useMemo(() => {
    if (recurringPayments.length === 0) return [];
    
    const today = startOfMonth(new Date());
    
    // Find the latest completion date to determine the chart's timespan
    const allCompletionDates = recurringPayments.map(p => parseISO(p.completionDate));
    const maxCompletionDate = max(allCompletionDates);
    const monthsToProject = differenceInMonths(maxCompletionDate, today) + 2;

    const data = [];
    
    for (let i = 0; i < monthsToProject; i++) {
        const projectionMonth = startOfMonth(addMonths(today, i));
        
        let remainingDebt = 0;
        recurringPayments.forEach(p => {
            const startDate = parseISO(p.date);
            const completionDate = parseISO(p.completionDate);
            
            if (isAfter(projectionMonth, completionDate)) {
                return; // This payment is already completed
            }

            if (!isAfter(projectionMonth, startDate)) {
                // Payment hasn't started yet, add its full amount
                remainingDebt += p.amount * p.numberOfPayments;
            } else {
                // Payment is active, calculate remaining installments
                const monthsPassed = differenceInMonths(projectionMonth, startDate);
                const paymentsMade = Math.max(0, monthsPassed);
                const remainingInstallments = Math.max(0, p.numberOfPayments - paymentsMade);
                remainingDebt += p.amount * remainingInstallments;
            }
        });

        data.push({
            date: format(projectionMonth, 'MMM yyyy', { locale }),
            debt: remainingDebt,
        });

        if (remainingDebt <= 0 && i > 0) {
            // Stop projecting if debt is paid off
            break;
        }
    }

    return data;
  }, [recurringPayments, locale]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="font-bold col-span-2">{label}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2.5 w-2.5 rounded-full" style={{backgroundColor: 'hsl(var(--chart-5))'}}/>
                {t('debtPayoffChart.legend')}
            </div>
            <div className="text-sm font-mono text-right">{formatCurrency(payload[0].value)}</div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  if (recurringPayments.length === 0) {
    return (
       <Card>
           <CardHeader>
               <CardTitle>{t('debtPayoffChart.title')}</CardTitle>
               <CardDescription>{t('debtPayoffChart.description')}</CardDescription>
           </CardHeader>
           <CardContent className="flex items-center justify-center h-[250px] sm:h-[300px]">
               <p className="text-muted-foreground">{t('debtPayoffChart.noData')}</p>
           </CardContent>
       </Card>
   );
 }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('debtPayoffChart.title')}</CardTitle>
        <CardDescription>{t('debtPayoffChart.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={projectionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorDebt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-5))" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="hsl(var(--chart-5))" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))"/>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              content={<CustomTooltip />}
            />
            <Legend wrapperStyle={{color: 'hsl(var(--muted-foreground))'}}/>
            <Area type="monotone" dataKey="debt" name={t('debtPayoffChart.legend')} stroke="hsl(var(--chart-5))" fill="url(#colorDebt)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
