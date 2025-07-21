
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment, AnyTransaction } from "@/types/fintrack";
import { format, parseISO, isSameDay, startOfMonth, getDate, isWithinInterval, setDate } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useSettings } from '@/hooks/use-settings';
import { Separator } from '../ui/separator';

interface PaymentCalendarProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  onPaymentClick: (payment: AnyTransaction) => void;
}

export function PaymentCalendar({ recurringPayments, oneTimePayments, onPaymentClick }: PaymentCalendarProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const paymentDaysInMonth = useMemo(() => {
    const dates = new Set<string>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    oneTimePayments.forEach(p => {
        const dueDate = parseISO(p.dueDate);
        if(isWithinInterval(dueDate, { start: monthStart, end: monthEnd })) {
            dates.add(format(dueDate, 'yyyy-MM-dd'));
        }
    });

    recurringPayments.forEach(p => {
      const startDate = parseISO(p.startDate);
      const endDate = parseISO(p.completionDate);
      let paymentDate = setDate(monthStart, getDate(startDate));

      if (isWithinInterval(paymentDate, { start: startDate, end: endDate }) && isWithinInterval(paymentDate, { start: monthStart, end: monthEnd })) {
         dates.add(format(paymentDate, 'yyyy-MM-dd'));
      }
    });

    return Array.from(dates).map(d => parseISO(d));
  }, [recurringPayments, oneTimePayments, currentMonth]);

  const selectedDayPayments = useMemo(() => {
    if (!selectedDate) return [];
    
    const oneTime: AnyTransaction[] = oneTimePayments
      .filter(p => isSameDay(parseISO(p.dueDate), selectedDate))
      .map(p => ({ ...p, type: 'oneTimePayment' }));
    
    const recurring: AnyTransaction[] = recurringPayments
      .filter(p => {
        const startDate = parseISO(p.startDate);
        const completionDate = parseISO(p.completionDate);
        
        const isWithin = isWithinInterval(selectedDate, { start: startDate, end: completionDate });
        if (!isWithin) return false;

        return getDate(selectedDate) === getDate(startDate);
      })
      .map(p => ({
        ...p,
        type: 'payment',
      }));

    return [...oneTime, ...recurring].sort((a, b) => a.amount - b.amount);
  }, [selectedDate, recurringPayments, oneTimePayments]);
  
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
      <CardContent className="flex flex-col gap-4">
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
          <Separator />
          <div className="w-full">
              <h3 className="text-md font-semibold mb-2">{selectedDate ? format(selectedDate, 'PPP', {locale: locale}) : t('calendar.selectDate')}</h3>
              {selectedDate && selectedDayPayments.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
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
                  <p className="text-sm text-muted-foreground mt-2">{t('calendar.noPayments')}</p>
              ) : (
                   <p className="text-sm text-muted-foreground mt-2">{t('calendar.selectDayHint')}</p>
              )}
          </div>
      </CardContent>
    </Card>
  );
}
