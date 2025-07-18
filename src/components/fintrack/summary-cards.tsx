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
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
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
          <CardTitle className="text-sm font-medium">Aktueller Kontostand</CardTitle>
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
               <Button size="sm" onClick={handleBalanceSave}>Speichern</Button>
            </div>
          ) : (
             <div className="text-2xl font-bold text-foreground" onClick={() => setIsEditingBalance(true)} role="button">
              {formatCurrency(currentBalance)}
            </div>
          )}
          <p className="text-xs text-muted-foreground">Kontostand anklicken zum Bearbeiten</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monatliches Einkommen</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalMonthlyIncome)}</div>
          <p className="text-xs text-muted-foreground">Ihre gesamten Einnahmen pro Monat</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monatliche Ausgaben</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(totalMonthlyExpenses)}</div>
          <p className="text-xs text-muted-foreground">Ihre gesamten Ausgaben pro Monat</p>
        </CardContent>
      </Card>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Nettoersparnis pro Monat</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netMonthlySavings >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(netMonthlySavings)}
          </div>
          <p className="text-xs text-muted-foreground">Ihr finanzieller Überschuss oder Defizit</p>
        </CardContent>
      </Card>
    </div>
  );
}
