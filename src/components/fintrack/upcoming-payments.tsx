
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types/fintrack";
import { format, parseISO, isWithinInterval, startOfMonth, endOfMonth, getDate, setDate, startOfToday } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useSettings } from '@/hooks/use-settings';

interface UpcomingPaymentsCardProps {
  transactions: Transaction[];
  onPaymentClick: (payment: Transaction) => void;
}

type UpcomingPayment = Transaction & { sortDate: Date };

export function UpcomingPaymentsCard({ transactions = [], onPaymentClick }: UpcomingPaymentsCardProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const { upcomingPayments, totalAmount } = useMemo(() => {
    const today = startOfToday();
    const monthEnd = endOfMonth(today);
    const payments: UpcomingPayment[] = [];

    const paymentInterval = { start: today, end: monthEnd };

    transactions.forEach(t => {
      if ((t.category === 'payment' || t.category === 'expense') && t.status !== 'paid') {
        const transactionDate = parseISO(t.date);

        if (t.recurrence === 'once') {
          if (isWithinInterval(transactionDate, paymentInterval)) {
            payments.push({ ...t, sortDate: transactionDate });
          }
        } else if (t.recurrence === 'monthly') {
          const paymentDateInMonth = setDate(startOfMonth(today), getDate(transactionDate));
          const isInInterval = isWithinInterval(paymentDateInMonth, paymentInterval);

          if (isInInterval) {
            if (t.installmentDetails) { // Recurring payment
              const installmentStartDate = parseISO(t.date);
              const installmentEndDate = parseISO(t.installmentDetails.completionDate);
              if (isWithinInterval(paymentDateInMonth, { start: installmentStartDate, end: installmentEndDate })) {
                payments.push({ ...t, sortDate: paymentDateInMonth });
              }
            } else { // Recurring expense
              payments.push({ ...t, sortDate: paymentDateInMonth });
            }
          }
        }
      }
    });
    
    const sortedPayments = payments.sort((a, b) => a.sortDate.getTime() - b.sortDate.getTime());
    const total = sortedPayments.reduce((sum, p) => sum + p.amount, 0);

    return { upcomingPayments: sortedPayments, totalAmount: total };
  }, [transactions]);

  const getDisplayDate = (p: UpcomingPayment) => {
    return p.sortDate;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t('upcomingPayments.title')}</CardTitle>
        <CardDescription>{t('upcomingPayments.description')}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] flex flex-col">
        {upcomingPayments.length > 0 ? (
          <ul className="space-y-2 pr-4 overflow-y-auto flex-grow">
            {upcomingPayments.map((p) => (
              <li 
                key={p.id + p.sortDate.toISOString()}
                className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                onClick={() => onPaymentClick(p)}
                role="button"
              >
                <div className="flex flex-col">
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{format(getDisplayDate(p), 'dd. MMM', { locale: locale })}</span>
                </div>
                <Badge variant="secondary" className="font-mono whitespace-nowrap">{formatCurrency(p.amount)}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-grow flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">{t('upcomingPayments.noPayments')}</p>
          </div>
        )}
      </CardContent>
       {upcomingPayments.length > 0 && (
          <CardFooter className="pt-4 border-t mt-auto">
             <div className="w-full flex justify-between items-center text-sm font-semibold">
                <span>{t('upcomingPayments.total')}</span>
                <span className="font-mono">{formatCurrency(totalAmount)}</span>
             </div>
          </CardFooter>
       )}
    </Card>
  );
}
