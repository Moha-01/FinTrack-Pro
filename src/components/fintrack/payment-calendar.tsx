"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { addMonths, format, parseISO, isSameDay, startOfMonth, getDate, isWithinInterval } from 'date-fns';
import { de } from 'date-fns/locale';

interface PaymentCalendarProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

export function PaymentCalendar({ recurringPayments, oneTimePayments }: PaymentCalendarProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const paymentDays = useMemo(() => {
    const dates = new Set<string>();
    const today = new Date();
    const twoYearsFromNow = addMonths(today, 24);

    oneTimePayments.forEach(p => {
        const dueDate = parseISO(p.dueDate);
        if(dueDate <= twoYearsFromNow) {
            dates.add(format(dueDate, 'yyyy-MM-dd'));
        }
    });

    recurringPayments.forEach(p => {
      let currentDate = parseISO(p.startDate);
      const endDate = parseISO(p.completionDate);
      
      while (currentDate <= endDate && currentDate <= twoYearsFromNow) {
        dates.add(format(currentDate, 'yyyy-MM-dd'));
        currentDate = addMonths(currentDate, 1);
      }
    });

    return Array.from(dates).map(d => parseISO(d));
  }, [recurringPayments, oneTimePayments]);

  const selectedDayPayments = useMemo(() => {
    if (!date) return [];
    
    const oneTime = oneTimePayments.filter(p => isSameDay(parseISO(p.dueDate), date));
    
    const recurring = recurringPayments.filter(p => {
      const startDate = parseISO(p.startDate);
      const completionDate = parseISO(p.completionDate);
      
      // Check if the selected date is within the payment interval
      const isWithin = isWithinInterval(date, { start: startDate, end: completionDate });
      if (!isWithin) return false;

      // Check if the day of the month matches
      return getDate(date) === getDate(startDate);
    });

    return [...oneTime, ...recurring].sort((a, b) => a.amount - b.amount);
  }, [date, recurringPayments, oneTimePayments]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Zahlungskalender</CardTitle>
        <CardDescription>Ihre anstehenden Zahlungen auf einen Blick.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border p-0"
            locale={de}
            modifiers={{
              paymentDay: paymentDays,
            }}
            modifiersStyles={{
              paymentDay: {
                color: 'hsl(var(--primary-foreground))',
                backgroundColor: 'hsl(var(--primary))',
                borderRadius: '9999px',
                opacity: 0.8
              },
            }}
          />
        </div>
        <div className="w-full sm:w-2/5 sm:border-l sm:pl-4">
            <h3 className="text-lg font-semibold mb-2">{date ? format(date, 'PPP', {locale: de}) : 'Datum auswählen'}</h3>
            {date && selectedDayPayments.length > 0 ? (
                <ul className="space-y-2">
                    {selectedDayPayments.map((p, i) => (
                        <li key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                            <span className="font-medium truncate pr-2">{p.name}</span>
                            <Badge variant="secondary" className="font-mono">{formatCurrency(p.amount)}</Badge>
                        </li>
                    ))}
                </ul>
            ) : date ? (
                <p className="text-sm text-muted-foreground mt-2">Keine Zahlungen an diesem Tag fällig.</p>
            ) : (
                 <p className="text-sm text-muted-foreground mt-2">Wählen Sie einen Tag aus, um die Zahlungen anzuzeigen.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
