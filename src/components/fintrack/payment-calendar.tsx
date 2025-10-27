
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/types/fintrack";
import { format, parseISO, isSameDay, startOfMonth, getDate, isWithinInterval, setDate, isAfter, endOfMonth } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { useSettings } from '@/hooks/use-settings';

interface PaymentCalendarProps {
  transactions: Transaction[];
  onPaymentClick: (payment: Transaction) => void;
}

export function PaymentCalendar({ transactions = [], onPaymentClick }: PaymentCalendarProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  
  const paymentDaysInMonth = useMemo(() => {
    const dates = new Set<string>();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);

    transactions.forEach(t => {
      if ((t.category !== 'payment' && t.category !== 'expense') || t.status === 'paid') return;
      
      const transactionDate = parseISO(t.date);
      
      if (t.recurrence === 'once') {
        if(isWithinInterval(transactionDate, { start: monthStart, end: monthEnd })) {
          dates.add(format(transactionDate, 'yyyy-MM-dd'));
        }
      } else if (t.recurrence === 'monthly') {
        const paymentDateInMonth = setDate(monthStart, getDate(transactionDate));
        if (!isWithinInterval(paymentDateInMonth, { start: monthStart, end: monthEnd })) return;
        
        if (t.installmentDetails) { // Recurring Payment (Installment)
           const installmentEndDate = parseISO(t.installmentDetails.completionDate);
           if (!isAfter(transactionDate, paymentDateInMonth) && !isAfter(paymentDateInMonth, installmentEndDate)) {
             dates.add(format(paymentDateInMonth, 'yyyy-MM-dd'));
           }
        } else { // Recurring Expense
           if (!isAfter(transactionDate, paymentDateInMonth)) {
              dates.add(format(paymentDateInMonth, 'yyyy-MM-dd'));
           }
        }
      }
    });

    return Array.from(dates).map(d => parseISO(d));
  }, [transactions, currentMonth]);

  const selectedDayPayments = useMemo(() => {
    if (!selectedDate) return [];
    
    return transactions
      .filter(t => {
        if (t.status === 'paid' || (t.category !== 'expense' && t.category !== 'payment')) return false;

        const transactionDate = parseISO(t.date);
        
        if(t.recurrence === 'once') {
            return isSameDay(transactionDate, selectedDate);
        }
        
        if(t.recurrence === 'monthly') {
            if (getDate(transactionDate) !== getDate(selectedDate)) return false;
            
            if (t.installmentDetails) { // It's a recurring payment (installment)
                const installmentEndDate = parseISO(t.installmentDetails.completionDate);
                return !isAfter(transactionDate, selectedDate) && !isAfter(selectedDate, installmentEndDate);
            }
            
            return !isAfter(transactionDate, selectedDate); // It's a recurring expense
        }
        return false;
      })
      .sort((a, b) => a.amount - b.amount);
  }, [selectedDate, transactions]);
  
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
          <div className="w-full flex flex-col h-[220px]">
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
                                <span className="font-medium truncate pr-2">{p.name}</span>
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
