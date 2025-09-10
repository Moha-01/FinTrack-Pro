
"use client";

import React from 'react';
import type { ProfileData } from '@/types/fintrack';
import { useSettings } from '@/hooks/use-settings';
import { ExpenseBreakdownChart } from '../expense-breakdown-chart';
import { DebtPayoffChart } from '../debt-payoff-chart';
import { ProjectionChart } from '../projection-chart';
import { CashflowTrendChart } from '../cashflow-trend-chart';
import { BalanceHistoryChart } from '../balance-history-chart';


interface ReportsViewProps {
  profileData: ProfileData;
}

export function ReportsView({ profileData }: ReportsViewProps) {
    const { t } = useSettings();
    const { income, oneTimeIncomes, expenses, payments, oneTimePayments, currentBalance } = profileData;

  return (
     <>
      <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">{t('navigation.reports')}</h1>
          <p className="text-sm text-muted-foreground">{t('navigation.title')}</p>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <ExpenseBreakdownChart expenses={expenses} recurringPayments={payments} />
            <DebtPayoffChart recurringPayments={payments} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-8">
            <BalanceHistoryChart profileData={profileData} />
        </div>
        
         <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <CashflowTrendChart 
                income={income}
                oneTimeIncomes={oneTimeIncomes}
                expenses={expenses}
                recurringPayments={payments}
                oneTimePayments={oneTimePayments}
            />
            <ProjectionChart
                currentBalance={currentBalance}
                income={income}
                oneTimeIncomes={oneTimeIncomes}
                expenses={expenses}
                recurringPayments={payments}
                oneTimePayments={oneTimePayments}
            />
        </div>
     </>
  );
}
