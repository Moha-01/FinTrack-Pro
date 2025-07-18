
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { format, parseISO, isSameDay, startOfMonth, getDate, isWithinInterval, setDate } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useSettings } from '@/hooks/use-settings';

interface PaymentCalendarProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

export function PaymentCalendar({ recurringPayments, oneTimePayments }: PaymentCalendarProps) {
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
    
    const oneTime = oneTimePayments.filter(p => isSameDay(parseISO(p.dueDate), selectedDate));
    
    const recurring = recurringPayments.filter(p => {
      const startDate = parseISO(p.startDate);
      const completionDate = parseISO(p.completionDate);
      
      const isWithin = isWithinInterval(selectedDate, { start: startDate, end: completionDate });
      if (!isWithin) return false;

      return getDate(selectedDate) === getDate(startDate);
    });

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('calendar.title')}</CardTitle>
        <CardDescription>{t('calendar.description')}</CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="flex w-full max-w-xl flex-col items-center gap-4 md:flex-row md:items-start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border p-0 sm:p-3"
            locale={locale}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            initialFocus
          />
          <div className="w-full flex-1 md:w-[250px] md:border-l md:pl-4 pt-2">
              <h3 className="text-md font-semibold mb-2">{selectedDate ? format(selectedDate, 'PPP', {locale: locale}) : t('calendar.selectDate')}</h3>
              {selectedDate && selectedDayPayments.length > 0 ? (
                  <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                      {selectedDayPayments.map((p, i) => (
                          <li key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                              <span className="font-medium truncate pr-2">{p.name}</span>
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
        </div>
      </CardContent>
    </Card>
  );
}
