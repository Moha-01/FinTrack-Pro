
"use client";

import React from 'react';
import type { ProfileData, AnyTransaction } from '@/types/fintrack';
import { useSettings } from '@/hooks/use-settings';

import { SummaryCards } from '../summary-cards';
import { PaymentCalendar } from '../payment-calendar';
import { UpcomingPaymentsCard } from '../upcoming-payments';
import { CashflowTrendChart } from '../cashflow-trend-chart';
import { SmartInsightCard } from '../smart-insight-card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface DashboardViewProps {
  summaryData: {
    currentBalance: number;
    lastUpdated: string;
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netMonthlySavings: number;
  };
  profileData: ProfileData;
  onBalanceChange: (newBalance: number) => void;
  onAddTransactionClick: () => void;
  onPaymentClick: (payment: AnyTransaction) => void;
}

export function DashboardView({ summaryData, profileData, onBalanceChange, onAddTransactionClick, onPaymentClick }: DashboardViewProps) {
  const { t } = useSettings();
  const { payments, oneTimePayments, income, expenses } = profileData;

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex flex-col gap-2">
              <h1 className="text-lg font-semibold md:text-2xl">{t('navigation.dashboard')}</h1>
              <p className="text-sm text-muted-foreground">{t('header.welcomeSubtitle')}</p>
          </div>
          <Button onClick={onAddTransactionClick} className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('dataTabs.addTransaction')}
          </Button>
      </div>
      <SummaryCards data={summaryData} onBalanceChange={onBalanceChange} />
      
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
        <PaymentCalendar recurringPayments={payments} oneTimePayments={oneTimePayments} expenses={expenses} onPaymentClick={onPaymentClick} />
        <UpcomingPaymentsCard recurringPayments={payments} oneTimePayments={oneTimePayments} expenses={expenses} onPaymentClick={onPaymentClick} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:gap-8">
        <CashflowTrendChart 
            income={income}
            expenses={expenses}
            recurringPayments={payments}
            oneTimePayments={oneTimePayments}
        />
      </div>

      <div className="space-y-4 md:space-y-8">
        <SmartInsightCard profileData={profileData} />
      </div>
    </>
  );
}
