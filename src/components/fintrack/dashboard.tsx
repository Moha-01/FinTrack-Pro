"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { Income, Expense, RecurringPayment, OneTimePayment } from '@/types/fintrack';
import { exportToJson, parseImportedJson } from '@/lib/csv';

import { DashboardHeader } from './header';
import { SummaryCards } from './summary-cards';
import { ProjectionChart } from './projection-chart';
import { DataTabs } from './data-tabs';
import { ExpenseBreakdownChart } from './expense-breakdown-chart';
import { addMonths, format } from 'date-fns';

const initialIncome: Income[] = [];
const initialExpenses: Expense[] = [];
const initialPayments: RecurringPayment[] = [];
const initialOneTimePayments: OneTimePayment[] = [];
const initialBalance = 0;


const getInitialState = <T,>(key: string, fallback: T): T => {
    if (typeof window === 'undefined') return fallback;
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.warn(`Error reading localStorage key "${key}":`, error);
        return fallback;
    }
};


export function Dashboard() {
  const [income, setIncome] = useState<Income[]>(() => getInitialState('fintrack_income', initialIncome));
  const [expenses, setExpenses] = useState<Expense[]>(() => getInitialState('fintrack_expenses', initialExpenses));
  const [payments, setPayments] = useState<RecurringPayment[]>(() => getInitialState('fintrack_payments', initialPayments));
  const [oneTimePayments, setOneTimePayments] = useState<OneTimePayment[]>(() => getInitialState('fintrack_oneTimePayments', initialOneTimePayments));
  const [currentBalance, setCurrentBalance] = useState<number>(() => getInitialState('fintrack_currentBalance', initialBalance));

  useEffect(() => { localStorage.setItem('fintrack_income', JSON.stringify(income)); }, [income]);
  useEffect(() => { localStorage.setItem('fintrack_expenses', JSON.stringify(expenses)); }, [expenses]);
  useEffect(() => { localStorage.setItem('fintrack_payments', JSON.stringify(payments)); }, [payments]);
  useEffect(() => { localStorage.setItem('fintrack_oneTimePayments', JSON.stringify(oneTimePayments)); }, [oneTimePayments]);
  useEffect(() => { localStorage.setItem('fintrack_currentBalance', JSON.stringify(currentBalance)); }, [currentBalance]);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddTransaction = useCallback((type: 'income' | 'expense' | 'payment' | 'oneTimePayment', data: any) => {
    const newTransaction = { ...data, id: crypto.randomUUID() };
    if (type === 'income') {
      setIncome(prev => [...prev, newTransaction]);
      toast({ title: "Erfolg", description: "Einkommen erfolgreich hinzugefügt." });
    } else if (type === 'expense') {
      setExpenses(prev => [...prev, newTransaction]);
      toast({ title: "Erfolg", description: "Ausgabe erfolgreich hinzugefügt." });
    } else if (type === 'payment') {
        const completionDate = format(addMonths(new Date(data.startDate), data.numberOfPayments), 'yyyy-MM-dd');
        setPayments(prev => [...prev, {...newTransaction, startDate: format(data.startDate, 'yyyy-MM-dd'), completionDate}]);
        toast({ title: "Erfolg", description: "Wiederkehrende Zahlung erfolgreich hinzugefügt." });
    } else { // oneTimePayment
        setOneTimePayments(prev => [...prev, {...newTransaction, dueDate: format(data.dueDate, 'yyyy-MM-dd')}]);
        toast({ title: "Erfolg", description: "Einmalige Zahlung erfolgreich hinzugefügt." });
    }
  }, [toast]);

  const handleDeleteTransaction = useCallback((type: 'income' | 'expense' | 'payment' | 'oneTimePayment', id: string) => {
    const typeMap = {
      income: "Einkommen",
      expense: "Ausgabe",
      payment: "Wiederkehrende Zahlung",
      oneTimePayment: "Einmalige Zahlung",
    }
    if (type === 'income') {
      setIncome(prev => prev.filter(item => item.id !== id));
    } else if (type === 'expense') {
      setExpenses(prev => prev.filter(item => item.id !== id));
    } else if (type === 'payment'){
      setPayments(prev => prev.filter(item => item.id !== id));
    } else { // oneTimePayment
      setOneTimePayments(prev => prev.filter(item => item.id !== id));
    }
    toast({ title: "Erfolg", description: `${typeMap[type]} entfernt.` });
  }, [toast]);

  const handleExport = useCallback(() => {
    exportToJson({income, expenses, recurringPayments: payments, oneTimePayments, currentBalance});
    toast({ title: 'Export erfolgreich', description: 'Ihre Daten wurden heruntergeladen.' });
  }, [income, expenses, payments, oneTimePayments, currentBalance]);
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedData = parseImportedJson(content);
      if (parsedData) {
        setIncome(parsedData.income);
        setExpenses(parsedData.expenses);
        setPayments(parsedData.recurringPayments);
        setOneTimePayments(parsedData.oneTimePayments);
        setCurrentBalance(parsedData.currentBalance);
        toast({ title: 'Import erfolgreich', description: 'Daten wurden geladen.' });
      } else {
        toast({ variant: 'destructive', title: 'Import fehlgeschlagen', description: 'Datei konnte nicht verarbeitet werden. Bitte prüfen Sie das Format.' });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const summaryData = useMemo(() => {
    const totalMonthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyPayments = payments.reduce((sum, item) => sum + item.amount, 0);
    return {
      currentBalance,
      totalMonthlyIncome,
      totalMonthlyExpenses: totalMonthlyExpenses + totalMonthlyPayments,
      netMonthlySavings: totalMonthlyIncome - totalMonthlyExpenses - totalMonthlyPayments
    };
  }, [income, expenses, payments, currentBalance]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <DashboardHeader onImportClick={handleImportClick} onExport={handleExport} />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        accept=".json"
      />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <SummaryCards data={summaryData} onBalanceChange={setCurrentBalance} />
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-5">
            <div className="lg:col-span-3">
                <DataTabs
                  income={income}
                  expenses={expenses}
                  payments={payments}
                  oneTimePayments={oneTimePayments}
                  onAdd={handleAddTransaction}
                  onDelete={handleDeleteTransaction}
                />
            </div>
            <div className="grid auto-rows-max gap-4 md:gap-8 lg:col-span-2">
                <ExpenseBreakdownChart expenses={expenses} recurringPayments={payments} />
                <ProjectionChart
                    currentBalance={currentBalance}
                    income={income}
                    expenses={expenses}
                    recurringPayments={payments}
                    oneTimePayments={oneTimePayments}
                />
            </div>
        </div>
      </main>
    </div>
  );
}
