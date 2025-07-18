"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { addMonths, format, parseISO, isSameDay, startOfMonth, getDate, isWithinInterval, setDate } from 'date-fns';
import { de } from 'date-fns/locale';

interface PaymentCalendarProps {
  recurringPayments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

export function PaymentCalendar({ recurringPayments, oneTimePayments }: PaymentCalendarProps) {
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Zahlungskalender</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-4 items-start">
        <div className="flex-1 w-full">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-md border p-0"
            locale={de}
            modifiers={{
              dot: paymentDaysInMonth,
            }}
            modifiersClassNames={{
                dot: "day_with_dot",
            }}
            classNames={{
                day_selected: "bg-accent text-accent-foreground hover:bg-accent/90 focus:bg-accent/90",
                day_today: "bg-primary/20"
            }}
          />
        </div>
        <div className="w-full md:w-2/5 md:border-l md:pl-4 pt-2">
            <h3 className="text-md font-semibold mb-2">{selectedDate ? format(selectedDate, 'PPP', {locale: de}) : 'Datum auswählen'}</h3>
            {selectedDate && selectedDayPayments.length > 0 ? (
                <ul className="space-y-2 max-h-36 overflow-y-auto pr-2">
                    {selectedDayPayments.map((p, i) => (
                        <li key={i} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                            <span className="font-medium truncate pr-2">{p.name}</span>
                            <Badge variant="secondary" className="font-mono whitespace-nowrap">{formatCurrency(p.amount)}</Badge>
                        </li>
                    ))}
                </ul>
            ) : selectedDate ? (
                <p className="text-sm text-muted-foreground mt-2">Keine Zahlungen an diesem Tag fällig.</p>
            ) : (
                 <p className="text-sm text-muted-foreground mt-2">Wählen Sie einen Tag aus, um die Zahlungen anzuzeigen.</p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
