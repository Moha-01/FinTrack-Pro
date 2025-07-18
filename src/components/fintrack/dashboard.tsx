
"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ProfileData, Income, Expense, RecurringPayment, OneTimePayment, TransactionType, AnyTransaction } from '@/types/fintrack';
import { exportToJson, parseImportedJson } from '@/lib/json-helpers';

import { DashboardHeader } from './header';
import { SummaryCards } from './summary-cards';
import { ProjectionChart } from './projection-chart';
import { DataManager } from './data-manager';
import { ExpenseBreakdownChart } from './expense-breakdown-chart';
import { PaymentCalendar } from './payment-calendar';
import { UpcomingPaymentsCard } from './upcoming-payments';
import { addMonths, format } from 'date-fns';
import { AboutCard } from './about-card';
import { useSettings } from '@/hooks/use-settings';
import { AddTransactionDialog } from './add-transaction-dialog';

const emptyProfileData: ProfileData = {
  income: [],
  expenses: [],
  payments: [],
  oneTimePayments: [],
  currentBalance: 0,
};

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
  const { t } = useSettings();
  const [profiles, setProfiles] = useState<string[]>(() => getInitialState('fintrack_profiles', ['Standard']));
  const [activeProfile, setActiveProfile] = useState<string>(() => {
    const savedProfile = getInitialState('fintrack_activeProfile', 'Standard');
    const allProfiles = getInitialState('fintrack_profiles', ['Standard']);
    return allProfiles.includes(savedProfile) ? savedProfile : allProfiles[0] || 'Standard';
  });
  
  const [profileData, setProfileData] = useState<ProfileData>(() => getInitialState(`fintrack_data_${activeProfile}`, emptyProfileData));
  const { income, expenses, payments, oneTimePayments, currentBalance } = profileData;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<AnyTransaction | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fintrack_profiles', JSON.stringify(profiles));
    }
  }, [profiles]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('fintrack_activeProfile', activeProfile);
      setProfileData(getInitialState(`fintrack_data_${activeProfile}`, emptyProfileData));
    }
  }, [activeProfile]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`fintrack_data_${activeProfile}`, JSON.stringify(profileData));
    }
  }, [profileData, activeProfile]);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setIncome = (updater: React.SetStateAction<Income[]>) => setProfileData(p => ({...p, income: typeof updater === 'function' ? updater(p.income) : updater }));
  const setExpenses = (updater: React.SetStateAction<Expense[]>) => setProfileData(p => ({...p, expenses: typeof updater === 'function' ? updater(p.expenses) : updater }));
  const setPayments = (updater: React.SetStateAction<RecurringPayment[]>) => setProfileData(p => ({...p, payments: typeof updater === 'function' ? updater(p.payments) : updater }));
  const setOneTimePayments = (updater: React.SetStateAction<OneTimePayment[]>) => setProfileData(p => ({...p, oneTimePayments: typeof updater === 'function' ? updater(p.oneTimePayments) : updater }));
  const setCurrentBalance = (updater: React.SetStateAction<number>) => setProfileData(p => ({...p, currentBalance: typeof updater === 'function' ? updater(p.currentBalance) : updater }));
  
  const handleAddClick = () => {
    setTransactionToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (transaction: AnyTransaction) => {
    setTransactionToEdit(transaction);
    setIsDialogOpen(true);
  };

  const handleAddTransaction = useCallback((type: TransactionType, data: any) => {
    const newTransaction = { ...data, id: crypto.randomUUID() };
    if (type === 'income') {
      setIncome(prev => [...prev, newTransaction]);
      toast({ title: t('common.success'), description: t('toasts.incomeAdded') });
    } else if (type === 'expense') {
      setExpenses(prev => [...prev, newTransaction]);
      toast({ title: t('common.success'), description: t('toasts.expenseAdded') });
    } else if (type === 'payment') {
        const completionDate = format(addMonths(new Date(data.startDate), data.numberOfPayments), 'yyyy-MM-dd');
        setPayments(prev => [...prev, {...newTransaction, startDate: format(data.startDate, 'yyyy-MM-dd'), completionDate}]);
        toast({ title: t('common.success'), description: t('toasts.recurringPaymentAdded') });
    } else { // oneTimePayment
        setOneTimePayments(prev => [...prev, {...newTransaction, dueDate: format(data.dueDate, 'yyyy-MM-dd')}]);
        toast({ title: t('common.success'), description: t('toasts.oneTimePaymentAdded') });
    }
  }, [toast, t, setIncome, setExpenses, setPayments, setOneTimePayments]);
  
  const handleUpdateTransaction = useCallback((type: TransactionType, data: AnyTransaction) => {
    const updatedData = {...data};

    const updater = (prev: any[]) => prev.map(item => item.id === updatedData.id ? updatedData : item);

    if (type === 'income') {
        setIncome(updater);
    } else if (type === 'expense') {
        setExpenses(updater);
    } else if (type === 'payment') {
        const paymentData = updatedData as RecurringPayment;
        paymentData.startDate = format(new Date(paymentData.startDate), 'yyyy-MM-dd');
        paymentData.completionDate = format(addMonths(new Date(paymentData.startDate), paymentData.numberOfPayments), 'yyyy-MM-dd');
        setPayments(updater);
    } else { // oneTimePayment
        const oneTimeData = updatedData as OneTimePayment;
        oneTimeData.dueDate = format(new Date(oneTimeData.dueDate), 'yyyy-MM-dd');
        setOneTimePayments(updater);
    }
    toast({ title: t('common.success'), description: t('toasts.itemUpdated') });
    setTransactionToEdit(null);
  }, [toast, t, setIncome, setExpenses, setPayments, setOneTimePayments]);


  const handleDeleteTransaction = useCallback((type: TransactionType, id: string) => {
    const typeMap = {
      income: t('common.income'),
      expense: t('common.expense'),
      payment: t('common.recurringPayment'),
      oneTimePayment: t('common.oneTimePayment'),
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
    toast({ title: t('common.success'), description: t('toasts.itemRemoved', {item: typeMap[type]}) });
  }, [toast, t, setIncome, setExpenses, setPayments, setOneTimePayments]);

  const handleExport = useCallback(() => {
    const allProfileData: Record<string, ProfileData> = {};
    profiles.forEach(p => {
        allProfileData[p] = getInitialState(`fintrack_data_${p}`, emptyProfileData);
    });
    
    exportToJson({
        profiles,
        activeProfile,
        profileData: allProfileData
    });
    toast({ title: t('toasts.exportSuccessTitle'), description: t('toasts.exportSuccessDescription') });
  }, [profiles, activeProfile, t, toast]);
  
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
        // Clear existing profile data
        const existingProfiles = getInitialState('fintrack_profiles', []);
        existingProfiles.forEach((p: string) => localStorage.removeItem(`fintrack_data_${p}`));

        // Set new data
        setProfiles(parsedData.profiles);
        setActiveProfile(parsedData.activeProfile);
        Object.entries(parsedData.profileData).forEach(([profileName, data]) => {
            localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(data));
        });

        // Force a reload of the active profile's data into the component state
        setProfileData(parsedData.profileData[parsedData.activeProfile]);
        
        toast({ title: t('toasts.importSuccessTitle'), description: t('toasts.importSuccessDescription') });
      } else {
        toast({ variant: 'destructive', title: t('toasts.importFailedTitle'), description: t('toasts.importFailedDescription') });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  const handleProfileChange = (profileName: string) => {
    setActiveProfile(profileName);
  };

  const handleAddProfile = (profileName: string) => {
    if (!profileName || profiles.includes(profileName)) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('toasts.profileInvalid') });
      return;
    }
    const newProfiles = [...profiles, profileName];
    setProfiles(newProfiles);
    setActiveProfile(profileName);
    localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(emptyProfileData));
    toast({ title: t('common.success'), description: t('toasts.profileCreated', {profileName})});
  };

  const handleDeleteProfile = (profileName: string) => {
    if (profileName === 'Standard' || profiles.length <= 1) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('toasts.profileDeleteError') });
      return;
    }
    const newProfiles = profiles.filter(p => p !== profileName);
    setProfiles(newProfiles);
    localStorage.removeItem(`fintrack_data_${profileName}`);
    
    if (activeProfile === profileName) {
      setActiveProfile(newProfiles[0]);
    }
    toast({ title: t('common.success'), description: t('toasts.profileDeleted', {profileName})});
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
      <AddTransactionDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAdd={handleAddTransaction}
        onUpdate={handleUpdateTransaction}
        transactionToEdit={transactionToEdit}
      />
      <DashboardHeader 
        onImportClick={handleImportClick} 
        onExport={handleExport}
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileChange={handleProfileChange}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        accept=".json"
      />
      <main className="flex flex-1 flex-col gap-4 p-4 sm:p-6 md:gap-8 md:p-8">
        <SummaryCards data={summaryData} onBalanceChange={setCurrentBalance} />
        
        <div className="grid grid-cols-1 gap-4 md:gap-8">
            <DataManager
                income={income}
                expenses={expenses}
                payments={payments}
                oneTimePayments={oneTimePayments}
                onAddClick={handleAddClick}
                onEditClick={handleEditClick}
                onDelete={handleDeleteTransaction}
            />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <div className="space-y-4 md:space-y-8">
                <PaymentCalendar recurringPayments={payments} oneTimePayments={oneTimePayments} />
                <UpcomingPaymentsCard recurringPayments={payments} oneTimePayments={oneTimePayments} />
            </div>
            <div className="space-y-4 md:space-y-8">
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
         <AboutCard />
      </main>
    </div>
  );
}
