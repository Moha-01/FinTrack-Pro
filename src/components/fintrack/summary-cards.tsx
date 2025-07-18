"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Banknote, DollarSign, TrendingDown, TrendingUp } from "lucide-react";

interface SummaryCardsProps {
  data: {
    currentBalance: number;
    totalMonthlyIncome: number;
    totalMonthlyExpenses: number;
    netMonthlySavings: number;
  };
  onBalanceChange: (newBalance: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export function SummaryCards({ data, onBalanceChange }: SummaryCardsProps) {
  const { currentBalance, totalMonthlyIncome, totalMonthlyExpenses, netMonthlySavings } = data;
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [editedBalance, setEditedBalance] = useState(currentBalance.toString());

  const handleBalanceSave = () => {
    onBalanceChange(parseFloat(editedBalance));
    setIsEditingBalance(false);
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {isEditingBalance ? (
             <div className="flex items-center gap-2">
               <Input 
                 type="number"
                 value={editedBalance}
                 onChange={(e) => setEditedBalance(e.target.value)}
                 className="text-2xl font-bold h-10"
               />
               <Button size="sm" onClick={handleBalanceSave}>Save</Button>
            </div>
          ) : (
             <div className="text-2xl font-bold text-foreground" onClick={() => setIsEditingBalance(true)} role="button">
              {formatCurrency(currentBalance)}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Click balance to edit</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">Your total earnings per month</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Monthly Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">Your total spending per month</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Monthly Savings</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netMonthlySavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(netMonthlySavings)}
          </div>
          <p className="text-xs text-muted-foreground">Your financial surplus or deficit</p>
        </CardContent>
      </Card>
    </div>
  );
}
