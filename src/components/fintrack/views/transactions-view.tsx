
"use client";

import React from 'react';
import type { ProfileData, AnyTransaction, TransactionType } from '@/types/fintrack';
import { useSettings } from '@/hooks/use-settings';
import { DataManager } from '../data-manager';
import { Button } from '@/components/ui/button';
import { PlusCircle, Printer } from 'lucide-react';

interface TransactionsViewProps {
  profileData: ProfileData;
  onAddClick: () => void;
  onEditClick: (transaction: AnyTransaction) => void;
  onDelete: (type: TransactionType, id: string) => void;
  onRowClick: (transaction: AnyTransaction) => void;
  onToggleOneTimePaymentStatus: (id: string) => void;
  onPrintReport: () => void;
  isPrinting: boolean;
}

export function TransactionsView({ profileData, onAddClick, onEditClick, onDelete, onRowClick, onToggleOneTimePaymentStatus, onPrintReport, isPrinting }: TransactionsViewProps) {
    const { t } = useSettings();
    const { income, oneTimeIncomes, expenses, payments, oneTimePayments } = profileData;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col gap-2">
              <h1 className="text-lg font-semibold md:text-2xl">{t('navigation.transactions')}</h1>
              <p className="text-sm text-muted-foreground">{t('dataTabs.description')}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
             <Button onClick={onPrintReport} variant="outline" className="w-full sm:w-auto" disabled={isPrinting}>
                <Printer className="mr-2 h-4 w-4" />
                {t('header.printReport')}
            </Button>
            <Button onClick={onAddClick} className="w-full sm:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" />
                {t('dataTabs.addTransaction')}
            </Button>
          </div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8">
          <DataManager
              income={income}
              oneTimeIncomes={oneTimeIncomes}
              expenses={expenses}
              payments={payments}
              oneTimePayments={oneTimePayments}
              onAddClick={onAddClick}
              onEditClick={onEditClick}
              onDelete={onDelete}
              onRowClick={onRowClick}
              onToggleOneTimePaymentStatus={onToggleOneTimePaymentStatus}
          />
      </div>
    </>
  );
}
