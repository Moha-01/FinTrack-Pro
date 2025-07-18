
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getDate, setDate, startOfToday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/hooks/use-settings';

interface UpcomingPaymentsCardProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

type UpcomingPayment = {
  name: string;
  amount: number;
  dueDate: Date;
}

export function UpcomingPaymentsCard({ recurringPayments, oneTimePayments }: UpcomingPaymentsCardProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const upcomingPayments = useMemo(() => {
    const today = startOfToday();
    const monthEnd = endOfMonth(today);
    const payments: UpcomingPayment[] = [];

    // Filter to only include payments from today until the end of the month.
    const paymentInterval = { start: today, end: monthEnd };

    oneTimePayments.forEach(p => {
        const dueDate = parseISO(p.dueDate);
        if(isWithinInterval(dueDate, paymentInterval)) {
            payments.push({ name: p.name, amount: p.amount, dueDate });
        }
    });

    recurringPayments.forEach(p => {
      const startDate = parseISO(p.startDate);
      const endDate = parseISO(p.completionDate);
      const paymentDateInMonth = setDate(startOfMonth(today), getDate(startDate));
      
      // Check if the potential payment date is within the allowed interval (today to end of month)
      // and also within the payment's active range (start to completion date).
      if(isWithinInterval(paymentDateInMonth, paymentInterval) && isWithinInterval(paymentDateInMonth, {start: startDate, end: endDate})) {
         payments.push({ name: p.name, amount: p.amount, dueDate: paymentDateInMonth });
      }
    });

    return payments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [recurringPayments, oneTimePayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upcomingPayments.title')}</CardTitle>
        <CardDescription>{t('upcomingPayments.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingPayments.length > 0 ? (
          <ScrollArea className="h-48">
            <ul className="space-y-2 pr-4">
              {upcomingPayments.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                  <div className="flex flex-col">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{format(p.dueDate, 'dd. MMM', { locale: locale })}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono whitespace-nowrap">{formatCurrency(p.amount)}</Badge>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">{t('upcomingPayments.noPayments')}</p>
        )}
      </CardContent>
    </Card>
  );
}
