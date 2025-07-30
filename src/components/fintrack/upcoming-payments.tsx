
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment, AnyTransaction, Expense } from "@/types/fintrack";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getDate, setDate, startOfToday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSettings } from '@/hooks/use-settings';

interface UpcomingPaymentsCardProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  expenses: Expense[];
  onPaymentClick: (payment: AnyTransaction) => void;
}

type UpcomingPayment = AnyTransaction & { sortDate: Date };

export function UpcomingPaymentsCard({ recurringPayments, oneTimePayments, expenses, onPaymentClick }: UpcomingPaymentsCardProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const upcomingPayments = useMemo(() => {
    const today = startOfToday();
    const monthEnd = endOfMonth(today);
    const payments: UpcomingPayment[] = [];

    const paymentInterval = { start: today, end: monthEnd };

    oneTimePayments.forEach(p => {
        if (p.status === 'paid') return;
        const dueDate = parseISO(p.date);
        if(isWithinInterval(dueDate, paymentInterval)) {
            payments.push({ ...p, type: 'oneTimePayment', sortDate: dueDate });
        }
    });

    recurringPayments.forEach(p => {
      const startDate = parseISO(p.date);
      const endDate = parseISO(p.completionDate);
      const paymentDateInMonth = setDate(startOfMonth(today), getDate(startDate));
      
      if(isWithinInterval(paymentDateInMonth, paymentInterval) && isWithinInterval(paymentDateInMonth, {start: startDate, end: endDate})) {
         payments.push({ ...p, type: 'payment', sortDate: paymentDateInMonth });
      }
    });

    expenses.forEach(e => {
        if (e.recurrence === 'monthly') {
            try {
                if(!e.date) return;
                const expenseDate = setDate(startOfMonth(today), getDate(parseISO(e.date)));
                if (isWithinInterval(expenseDate, paymentInterval)) {
                    payments.push({ ...e, type: 'expense', sortDate: expenseDate });
                }
            } catch (err) {
                // Ignore invalid dates like Feb 30
            }
        }
    });

    return payments.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
  }, [recurringPayments, oneTimePayments, expenses]);

  const getDisplayDate = (p: UpcomingPayment) => {
    return p.sortDate;
  }
  
  const getTransactionName = (transaction: AnyTransaction) => {
    if ('name' in transaction) return transaction.name;
    if ('source' in transaction) return transaction.source;
    if ('category' in transaction) return transaction.category;
    return 'N/A';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upcomingPayments.title')}</CardTitle>
        <CardDescription>{t('upcomingPayments.description')}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        {upcomingPayments.length > 0 ? (
          <ScrollArea className="max-h-48">
            <ul className="space-y-2 pr-4">
              {upcomingPayments.map((p) => (
                <li 
                  key={p.id + p.sortDate.toISOString()}
                  className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                  onClick={() => onPaymentClick(p)}
                  role="button"
                >
                  <div className="flex flex-col">
                      <span className="font-medium truncate">{getTransactionName(p)}</span>
                      <span className="text-xs text-muted-foreground">{format(getDisplayDate(p), 'dd. MMM', { locale: locale })}</span>
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
