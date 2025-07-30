
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment, AnyTransaction, Expense } from "@/types/fintrack";
import { format, parseISO, isSameDay, startOfMonth, getDate, isWithinInterval, setDate, getDay } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useSettings } from '@/hooks/use-settings';
import { Separator } from '../ui/separator';

interface PaymentCalendarProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  expenses: Expense[];
  onPaymentClick: (payment: AnyTransaction) => void;
}

export function PaymentCalendar({ recurringPayments, oneTimePayments, expenses, onPaymentClick }: PaymentCalendarProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const paymentDaysInMonth = useMemo(() => {
    const dates = new Set<string>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    oneTimePayments.forEach(p => {
        if (p.status === 'paid') return;
        const dueDate = parseISO(p.date);
        if(isWithinInterval(dueDate, { start: monthStart, end: monthEnd })) {
            dates.add(format(dueDate, 'yyyy-MM-dd'));
        }
    });

    recurringPayments.forEach(p => {
      const startDate = parseISO(p.date);
      const endDate = parseISO(p.completionDate);
      let paymentDate = setDate(monthStart, getDate(startDate));

      if (isWithinInterval(paymentDate, { start: startDate, end: endDate }) && isWithinInterval(paymentDate, { start: monthStart, end: monthEnd })) {
         dates.add(format(paymentDate, 'yyyy-MM-dd'));
      }
    });

    expenses.forEach(e => {
        if (e.recurrence === 'monthly' && e.date) {
            try {
              let paymentDate = setDate(monthStart, getDate(parseISO(e.date)));
              if (isWithinInterval(paymentDate, { start: monthStart, end: monthEnd })) {
                 dates.add(format(paymentDate, 'yyyy-MM-dd'));
              }
            } catch (err) {
              // Ignore invalid dates
            }
        }
    });

    return Array.from(dates).map(d => parseISO(d));
  }, [recurringPayments, oneTimePayments, expenses, currentMonth]);

  const selectedDayPayments = useMemo(() => {
    if (!selectedDate) return [];
    
    const oneTime: AnyTransaction[] = oneTimePayments
      .filter(p => p.status !== 'paid' && isSameDay(parseISO(p.date), selectedDate))
      .map(p => ({ ...p, type: 'oneTimePayment' }));
    
    const recurring: AnyTransaction[] = recurringPayments
      .filter(p => {
        const startDate = parseISO(p.date);
        const completionDate = parseISO(p.completionDate);
        
        const isWithin = isWithinInterval(selectedDate, { start: startDate, end: completionDate });
        if (!isWithin) return false;

        return getDate(selectedDate) === getDate(startDate);
      })
      .map(p => ({
        ...p,
        type: 'payment',
      }));
    
    const dueExpenses: AnyTransaction[] = expenses
      .filter(e => e.recurrence === 'monthly' && e.date && getDate(parseISO(e.date)) === getDate(selectedDate))
      .map(e => ({...e, type: 'expense'}));

    return [...oneTime, ...recurring, ...dueExpenses].sort((a, b) => a.amount - b.amount);
  }, [selectedDate, recurringPayments, oneTimePayments, expenses]);
  
  const modifiers = {
      paymentDay: paymentDaysInMonth,
  };
  
  const modifiersStyles = {
    paymentDay: {
      '--dot-color': 'hsl(var(--primary))',
    }
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
        <CardTitle>{t('calendar.title')}</CardTitle>
        <CardDescription>{t('calendar.description')}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              month={currentMonth}
              onMonthChange={setCurrentMonth}
              className="rounded-md border p-3 self-center"
              locale={locale}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
            />
          <div className="w-full flex flex-col">
              <h3 className="text-md font-semibold mb-2">{selectedDate ? format(selectedDate, 'PPP', {locale: locale}) : t('calendar.selectDate')}</h3>
              <div className="flex-grow overflow-hidden">
                {selectedDate && selectedDayPayments.length > 0 ? (
                    <ul className="space-y-2 pr-2 overflow-y-auto h-full">
                        {selectedDayPayments.map((p) => (
                            <li 
                              key={p.id}
                              className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                              onClick={() => onPaymentClick(p)}
                              role="button"
                            >
                                <span className="font-medium truncate pr-2">{getTransactionName(p)}</span>
                                <Badge variant="secondary" className="font-mono whitespace-nowrap">{formatCurrency(p.amount)}</Badge>
                            </li>
                        ))}
                    </ul>
                ) : selectedDate ? (
                    <div className="h-full flex items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground mt-2">{t('calendar.noPayments')}</p>
                    </div>
                ) : (
                     <div className="h-full flex items-center justify-center text-center">
                        <p className="text-sm text-muted-foreground mt-2">{t('calendar.selectDayHint')}</p>
                     </div>
                )}
              </div>
          </div>
      </CardContent>
    </Card>
  );
}
