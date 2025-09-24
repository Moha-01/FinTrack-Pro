
"use client";

import React from 'react';
import type { ProfileData, Transaction } from '@/types/fintrack';
import { useSettings } from '@/hooks/use-settings';
import { DataManager } from '../data-manager';
import { Button } from '@/components/ui/button';
import { PlusCircle, Printer } from 'lucide-react';

interface TransactionsViewProps {
  profileData: ProfileData;
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onRowClick: (transaction: Transaction) => void;
  onTogglePaymentStatus: (id: string) => void;
  onPrintReport: () => void;
  isPrinting: boolean;
}

export function TransactionsView({ profileData, onAddClick, onEditClick, onDelete, onRowClick, onTogglePaymentStatus, onPrintReport, isPrinting }: TransactionsViewProps) {
    const { t } = useSettings();
    const { transactions } = profileData;

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
              transactions={transactions}
              onAddClick={onAddClick}
              onEditClick={onEditClick}
              onDelete={onDelete}
              onRowClick={onRowClick}
              onToggleStatus={onTogglePaymentStatus}
          />
      </div>
    </>
  );
}
