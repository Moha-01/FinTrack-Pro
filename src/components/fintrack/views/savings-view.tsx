"use client";

import React from 'react';
import type { ProfileData } from '@/types/fintrack';
import { useSettings } from '@/hooks/use-settings';
import { SavingsGoalsCard } from '../savings-goals-card';
import { SavingsAccountsCard } from '../savings-accounts-card';

interface SavingsViewProps {
    profileData: ProfileData;
    savingsSummary: {
        totalInAccounts: number;
        totalAllocated: number;
        totalAvailable: number;
    };
    onAddGoalClick: () => void;
    onAddAccountClick: () => void;
    onEditGoalClick: (goal: any) => void;
    onEditAccountClick: (account: any) => void;
    onDeleteGoal: (id: string) => void;
    onDeleteAccount: (id: string) => void;
    onAddFundsToGoal: (id: string, amount: number) => void;
    onGoalPriorityChange: (id: string, direction: 'up' | 'down') => void;
}

export function SavingsView({ profileData, savingsSummary, onAddGoalClick, onAddAccountClick, onEditGoalClick, onEditAccountClick, onDeleteGoal, onDeleteAccount, onAddFundsToGoal, onGoalPriorityChange }: SavingsViewProps) {
    const { t } = useSettings();
    const { savingsGoals, savingsAccounts, currentBalance } = profileData;

  return (
     <>
      <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold md:text-2xl">{t('navigation.savings')}</h1>
          <p className="text-sm text-muted-foreground">{t('savingsGoals.description')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <SavingsGoalsCard
                goals={savingsGoals || []}
                accounts={savingsAccounts || []}
                currentBalance={currentBalance}
                onAddGoalClick={onAddGoalClick}
                onDeleteGoal={onDeleteGoal}
                onUpdateGoal={onAddFundsToGoal}
                onEditGoal={onEditGoalClick}
                onPriorityChange={onGoalPriorityChange}
            />
            <SavingsAccountsCard
                accounts={savingsAccounts || []}
                goals={savingsGoals || []}
                summary={savingsSummary}
                onAddAccountClick={onAddAccountClick}
                onDeleteAccount={onDeleteAccount}
                onEditAccount={onEditAccountClick}
            />
        </div>
     </>
  );
}
