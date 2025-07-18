"use client";

import React, { useState, useMemo, useCallback, useRef } from 'react';
import { getFinancialInsights } from '@/ai/flows/financial-insights';
import { useToast } from "@/hooks/use-toast";
import type { Income, Expense, RecurringPayment, OneTimePayment } from '@/types/fintrack';
import { exportToCsv, parseImportedData } from '@/lib/csv';

import { DashboardHeader } from './header';
import { SummaryCards } from './summary-cards';
import { ProjectionChart } from './projection-chart';
import { DataTabs } from './data-tabs';
import { SmartInsights } from './smart-insights';
import { ExpenseBreakdownChart } from './expense-breakdown-chart';
import { addMonths, format } from 'date-fns';

const initialIncome: Income[] = [
  { id: '1', source: 'Gehalt', amount: 5000, recurrence: 'monthly' },
  { id: '2', source: 'Freiberuflich', amount: 1200, recurrence: 'monthly' },
  { id: '3', source: 'Jahresbonus', amount: 8000, recurrence: 'yearly' },
];

const initialExpenses: Expense[] = [
  { id: '1', category: 'Miete', amount: 1500, recurrence: 'monthly' },
  { id: '2', category: 'Lebensmittel', amount: 400, recurrence: 'monthly' },
  { id: '3', category: 'Nebenkosten', amount: 200, recurrence: 'monthly' },
  { id: '4', category: 'Versicherung', amount: 1800, recurrence: 'yearly' },
];

const initialPayments: RecurringPayment[] = [
  { id: '1', name: 'Autokredit', amount: 350, startDate: '2023-01-15', numberOfPayments: 48, completionDate: '2026-12-15' },
  { id: '2', name: 'Studienkredit', amount: 250, startDate: '2022-09-01', numberOfPayments: 96, completionDate: '2030-08-01' },
];

const initialOneTimePayments: OneTimePayment[] = [
    { id: '1', name: 'Klarna-Kauf', amount: 150, dueDate: '2024-08-15' }
]


export function Dashboard() {
  const [income, setIncome] = useState<Income[]>(initialIncome);
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [payments, setPayments] = useState<RecurringPayment[]>(initialPayments);
  const [oneTimePayments, setOneTimePayments] = useState<OneTimePayment[]>(initialOneTimePayments);
  const [currentBalance, setCurrentBalance] = useState(10000);

  const [insights, setInsights] = useState<string>('');
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
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
        setPayments(prev => [...prev, {...newTransaction, completionDate}]);
        toast({ title: "Erfolg", description: "Wiederkehrende Zahlung erfolgreich hinzugefügt." });
    } else { // oneTimePayment
        setOneTimePayments(prev => [...prev, newTransaction]);
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

  const handleGenerateInsights = useCallback(async () => {
    setIsGeneratingInsights(true);
    try {
      const totalMonthlyIncome = income.reduce((acc, item) => acc + (item.recurrence === 'monthly' ? item.amount : item.amount / 12), 0);
      const totalMonthlyExpenses = expenses.reduce((acc, item) => acc + (item.recurrence === 'monthly' ? item.amount : item.amount / 12), 0);

      const insightInput = {
        income: totalMonthlyIncome,
        expenses: totalMonthlyExpenses,
        recurringPayments: payments.map(p => ({
            name: p.name,
            amount: p.amount,
            dueDate: new Date().toISOString().split('T')[0], // Placeholder, as not collected
            completionDate: p.completionDate,
            rate: 'N/A',
        })),
      };
      const result = await getFinancialInsights(insightInput);
      setInsights(result.insights);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Fehler', description: 'Finanzielle Einblicke konnten nicht generiert werden.' });
      setInsights('Einblicke konnten im Moment nicht generiert werden. Bitte versuchen Sie es später erneut.');
    } finally {
      setIsGeneratingInsights(false);
    }
  }, [income, expenses, payments, toast]);

  const handleExport = useCallback(() => {
    exportToCsv({income, expenses, recurringPayments: payments, oneTimePayments, currentBalance});
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
      const parsedData = parseImportedData(content);
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
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:p-8">
        <SummaryCards data={summaryData} onBalanceChange={setCurrentBalance} />
        <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <DataTabs
              income={income}
              expenses={expenses}
              payments={payments}
              oneTimePayments={oneTimePayments}
              onAdd={handleAddTransaction}
              onDelete={handleDeleteTransaction}
            />
          </div>
          <div className="grid auto-rows-max gap-4 md:gap-8">
             <ExpenseBreakdownChart expenses={expenses} recurringPayments={payments} />
            <ProjectionChart 
              currentBalance={currentBalance}
              income={income}
              expenses={expenses}
              recurringPayments={payments}
              oneTimePayments={oneTimePayments}
            />
            <SmartInsights
              insights={insights}
              onGenerate={handleGenerateInsights}
              isLoading={isGeneratingInsights}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
