
"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/hooks/use-settings";
import type { AnyTransaction, RecurringPayment } from "@/types/fintrack";
import { format, parseISO, differenceInCalendarMonths, isPast } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { DollarSign, CreditCard, CalendarClock, AlertCircle, Calendar, Hash, Milestone, CheckCircle } from 'lucide-react';

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  transaction: AnyTransaction | null;
}

const typeDetails: Record<string, { icon: React.ElementType, labelKey: string }> = {
    income: { icon: DollarSign, labelKey: 'common.income' },
    expense: { icon: CreditCard, labelKey: 'common.expense' },
    payment: { icon: CalendarClock, labelKey: 'common.recurringPayment' },
    oneTimePayment: { icon: AlertCircle, labelKey: 'common.oneTimePayment' },
};

export function TransactionDetailsDialog({ isOpen, onOpenChange, transaction }: TransactionDetailsDialogProps) {
  const { t, formatCurrency, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  // This guard clause prevents the component from crashing if the transaction is null or invalid.
  if (!transaction || !transaction.type || !typeDetails[transaction.type]) {
    return null;
  }

  const { icon: Icon, labelKey } = typeDetails[transaction.type] || { icon: DollarSign, labelKey: 'common.income' };
  const transactionName = 'name' in transaction ? transaction.name : ('source' in transaction ? transaction.source : transaction.category);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), "PPP", { locale });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const getPaymentDetails = () => {
    if (transaction.type !== 'payment') return null;
    
    const p = transaction as RecurringPayment;
    const startDate = parseISO(p.startDate);
    const monthsPassed = differenceInCalendarMonths(new Date(), startDate);
    const paymentsMade = Math.max(0, Math.min(monthsPassed + 1, p.numberOfPayments));
    const remainingPayments = p.numberOfPayments - paymentsMade;
    const remainingAmount = remainingPayments * p.amount;
    const totalAmount = p.amount * p.numberOfPayments;
    const isCompleted = isPast(parseISO(p.completionDate));

    return (
      <>
        <Separator className="my-4"/>
        <div className="space-y-3 text-sm">
            <h4 className="font-semibold text-base">{t('detailsDialog.paymentStatus')}</h4>
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4"/>{t('detailsDialog.totalAmount')}</span>
                <span className="font-semibold font-mono">{formatCurrency(totalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4"/>{t('dataTabs.startDate')}</span>
                <span className="font-medium">{formatDate(p.startDate)}</span>
            </div>
            <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><Milestone className="w-4 h-4"/>{t('dataTabs.endDate')}</span>
                <span className="font-medium">{formatDate(p.completionDate)}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><Hash className="w-4 h-4"/>{t('detailsDialog.installmentsPaid')}</span>
                <span className="font-medium">{paymentsMade} / {p.numberOfPayments}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="w-4 h-4"/>{t('detailsDialog.remainingInstallments')}</span>
                <span className="font-medium">{remainingPayments}</span>
            </div>
             <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-muted-foreground"><DollarSign className="w-4 h-4"/>{t('detailsDialog.remainingAmount')}</span>
                <span className="font-medium font-mono">{formatCurrency(remainingAmount)}</span>
            </div>
            {isCompleted && (
                <Badge variant="secondary" className="mt-2 w-full justify-center text-positive">
                    <CheckCircle className="mr-2 h-4 w-4"/> {t('detailsDialog.completed')}
                </Badge>
            )}
        </div>
      </>
    );
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-primary" />
            {t('detailsDialog.title')}
          </DialogTitle>
          <DialogDescription>{t('detailsDialog.description', { transactionName })}</DialogDescription>
        </DialogHeader>
        <div className="py-2">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">{t('common.amount')}</span>
                    <span className="text-2xl font-bold font-mono text-primary">{formatCurrency(transaction.amount)}</span>
                </div>
                <Badge variant="outline">{t(labelKey)}</Badge>
            </div>

            <div className="mt-4 text-sm space-y-2">
                { 'recurrence' in transaction && (
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('dataTabs.recurrence')}</span>
                        <span className="font-medium">{t(transaction.recurrence === 'monthly' ? 'dataTabs.monthly' : 'dataTabs.yearly')}</span>
                    </div>
                )}
                 { 'category' in transaction && (
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('dataTabs.category')}</span>
                        <span className="font-medium">{transaction.category}</span>
                    </div>
                )}
                { 'dueDate' in transaction && (
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('dataTabs.dueDate')}</span>
                        <span className="font-medium">{formatDate(transaction.dueDate)}</span>
                    </div>
                )}
            </div>
            {getPaymentDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
