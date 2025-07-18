
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Banknote, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useSettings } from '@/hooks/use-settings';

interface SummaryCardsProps {
  data: {
    currentBalance: number;
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netMonthlySavings: number;
  };
  onBalanceChange: (newBalance: number) => void;
}

export function SummaryCards({ data, onBalanceChange }: SummaryCardsProps) {
  const { t, formatCurrency } = useSettings();
  const { currentBalance, totalMonthlyIncome, totalMonthlyExpenses, netMonthlySavings } = data;
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editedBalance, setEditedBalance] = useState(currentBalance.toString());

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
          <p className="text-xs text-muted-foreground">{t('summary.balanceHint')}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.monthlyIncome')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 truncate">{formatCurrency(totalMonthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">{t('summary.monthlyIncomeHint')}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.monthlyExpenses')}</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 truncate">{formatCurrency(totalMonthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">{t('summary.monthlyExpensesHint')}</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('summary.netSavings')}</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold truncate ${netMonthlySavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(netMonthlySavings)}
          </div>
          <p className="text-xs text-muted-foreground">{t('summary.netSavingsHint')}</p>
        </CardContent>
      </Card>
    </div>
  );
}
