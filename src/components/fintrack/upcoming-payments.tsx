
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getDate, setDate } from 'date-fns';
import { de } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';

interface UpcomingPaymentsCardProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

type UpcomingPayment = {
  name: string;
  amount: number;
  dueDate: Date;
}

export function UpcomingPaymentsCard({ recurringPayments, oneTimePayments }: UpcomingPaymentsCardProps) {
  
  const upcomingPayments = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const payments: UpcomingPayment[] = [];

    // One-time payments for the current month
    oneTimePayments.forEach(p => {
        const dueDate = parseISO(p.dueDate);
        if(isWithinInterval(dueDate, { start: monthStart, end: monthEnd })) {
            payments.push({ name: p.name, amount: p.amount, dueDate });
        }
    });

    // Recurring payments for the current month
    recurringPayments.forEach(p => {
      const startDate = parseISO(p.startDate);
      const endDate = parseISO(p.completionDate);
      const paymentDateInMonth = setDate(monthStart, getDate(startDate));
      
      if(isWithinInterval(paymentDateInMonth, {start: startDate, end: endDate}) && isWithinInterval(paymentDateInMonth, {start: monthStart, end: monthEnd})) {
         payments.push({ name: p.name, amount: p.amount, dueDate: paymentDateInMonth });
      }
    });

    return payments.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
  }, [recurringPayments, oneTimePayments]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anstehende Zahlungen</CardTitle>
        <CardDescription>Ihre Zahlungen für diesen Monat.</CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingPayments.length > 0 ? (
          <ScrollArea className="h-48">
            <ul className="space-y-2 pr-4">
              {upcomingPayments.map((p, i) => (
                <li key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                  <div className="flex flex-col">
                      <span className="font-medium truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{format(p.dueDate, 'dd. MMM', { locale: de })}</span>
                  </div>
                  <Badge variant="secondary" className="font-mono whitespace-nowrap">{formatCurrency(p.amount)}</Badge>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-10">Keine anstehenden Zahlungen in diesem Monat.</p>
        )}
      </CardContent>
    </Card>
  );
}
