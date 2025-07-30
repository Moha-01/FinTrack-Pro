
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Banknote, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useSettings } from '@/hooks/use-settings';
import { format, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface SummaryCardsProps {
  data: {
    currentBalance: number;
    lastUpdated: string;
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netMonthlySavings: number;
  };
  onBalanceChange: (newBalance: number) => void;
}

export function SummaryCards({ data, onBalanceChange }: SummaryCardsProps) {
  const { t, formatCurrency, language } = useSettings();
  const { currentBalance, lastUpdated, totalMonthlyIncome, totalMonthlyExpenses, netMonthlySavings } = data;
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editedBalance, setEditedBalance] = useState(currentBalance.toString());
  const locale = language === 'de' ? de : enUS;

  const handleBalanceSave = () => {
    onBalanceChange(parseFloat(editedBalance) || 0);
    setIsEditingBalance(false);
  }

  const handleBalanceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleBalanceSave();
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.currentBalance')}</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditingBalance ? (
             <div className="flex items-center gap-2">
               <Input 
                 type="number"
                 value={editedBalance}
                 onChange={(e) => setEditedBalance(e.target.value)}
                 onBlur={handleBalanceSave}
                 onKeyDown={handleBalanceKeyDown}
                 className="text-2xl font-bold h-10"
                 autoFocus
               />
               <Button size="sm" onClick={handleBalanceSave}>{t('common.save')}</Button>
            </div>
          ) : (
             <div className="text-2xl font-bold text-foreground truncate" onClick={() => setIsEditingBalance(true)} role="button">
              {formatCurrency(currentBalance)}
            </div>
          )}
          <p className="text-xs text-muted-foreground" title={t('summary.balanceHint')}>
              {t('summary.lastUpdated', { date: lastUpdated ? format(parseISO(lastUpdated), 'P', { locale }) : 'N/A' })}
          </p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.monthlyIncome')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-positive truncate">{formatCurrency(totalMonthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">{t('summary.monthlyIncomeHint')}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.monthlyExpenses')}</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-negative truncate">{formatCurrency(totalMonthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">{t('summary.monthlyExpensesHint')}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.netSavings')}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold truncate ${netMonthlySavings >= 0 ? 'text-neutral' : 'text-negative'}`}>
            {formatCurrency(netMonthlySavings)}
          </div>
          <p className="text-xs text-muted-foreground">{t('summary.netSavingsHint')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

    