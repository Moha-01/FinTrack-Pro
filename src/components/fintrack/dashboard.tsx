
"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ProfileData, Income, Expense, RecurringPayment, OneTimePayment, TransactionType, AnyTransaction, FullAppData, AppSettings } from '@/types/fintrack';
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
import { SmartInsightCard } from './smart-insight-card';

const emptyProfileData: ProfileData = {
  income: [],
  expenses: [],
  payments: [],
  oneTimePayments: [],
  currentBalance: 0,
};

const getFromStorage = <T,>(key: string, fallback: T): T => {
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
  const { t, setLanguage, setCurrency, setGeminiApiKey, language, currency, geminiApiKey } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  
  const [profiles, setProfiles] = useState<string[]>(['Standard']);
  const [activeProfile, setActiveProfile] = useState<string>('Standard');
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfileData);
  const { income, expenses, payments, oneTimePayments, currentBalance } = profileData;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<AnyTransaction | null>(null);

  useEffect(() => {
    const savedProfiles = getFromStorage('fintrack_profiles', ['Standard']);
    const savedActiveProfile = getFromStorage('fintrack_activeProfile', 'Standard');
    
    setProfiles(savedProfiles);
    setActiveProfile(savedProfiles.includes(savedActiveProfile) ? savedActiveProfile : savedProfiles[0] || 'Standard');
    setProfileData(getFromStorage(`fintrack_data_${savedActiveProfile}`, emptyProfileData));

    setLanguage(getFromStorage('fintrack_language', 'de'));
    setCurrency(getFromStorage('fintrack_currency', 'EUR'));
    setGeminiApiKey(localStorage.getItem('fintrack_geminiApiKey'));
    
    setIsMounted(true);
  }, [setCurrency, setGeminiApiKey, setLanguage]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('fintrack_profiles', JSON.stringify(profiles));
    }
  }, [profiles, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('fintrack_activeProfile', activeProfile);
      setProfileData(getFromStorage(`fintrack_data_${activeProfile}`, emptyProfileData));
    }
  }, [activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem(`fintrack_data_${activeProfile}`, JSON.stringify(profileData));
    }
  }, [profileData, activeProfile, isMounted]);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAddClick = () => {
    setTransactionToEdit(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (transaction: AnyTransaction) => {
    setTransactionToEdit(transaction);
    setIsDialogOpen(true);
  };

  const handleAddTransaction = useCallback((type: TransactionType, data: any) => {
    setProfileData(prevData => {
        const newData = { ...prevData };
        const id = crypto.randomUUID();

        if (type === 'income') {
            const newIncome: Income = { ...data, id, type };
            newData.income = [...newData.income, newIncome];
            toast({ title: t('common.success'), description: t('toasts.incomeAdded') });
        } else if (type === 'expense') {
            const newExpense: Expense = { ...data, id, type };
            newData.expenses = [...newData.expenses, newExpense];
            toast({ title: t('common.success'), description: t('toasts.expenseAdded') });
        } else if (type === 'payment') {
            const completionDate = format(addMonths(new Date(data.startDate), data.numberOfPayments), 'yyyy-MM-dd');
            const newPayment: RecurringPayment = { ...data, id, type, startDate: format(data.startDate, 'yyyy-MM-dd'), completionDate };
            newData.payments = [...newData.payments, newPayment];
            toast({ title: t('common.success'), description: t('toasts.recurringPaymentAdded') });
        } else { // oneTimePayment
            const newOneTimePayment: OneTimePayment = { ...data, id, type, dueDate: format(data.dueDate, 'yyyy-MM-dd') };
            newData.oneTimePayments = [...newData.oneTimePayments, newOneTimePayment];
            toast({ title: t('common.success'), description: t('toasts.oneTimePaymentAdded') });
        }
        return newData;
    });
  }, [toast, t]);
  
  const handleUpdateTransaction = useCallback((type: TransactionType, data: AnyTransaction) => {
    setProfileData(prevData => {
        const newData = { ...prevData };
        if (type === 'income') {
            newData.income = newData.income.map(item => item.id === data.id ? data as Income : item);
        } else if (type === 'expense') {
            newData.expenses = newData.expenses.map(item => item.id === data.id ? data as Expense : item);
        } else if (type === 'payment') {
            const paymentData = data as RecurringPayment;
            const updatedPayment: RecurringPayment = {
                ...paymentData,
                startDate: format(new Date(paymentData.startDate), 'yyyy-MM-dd'),
                completionDate: format(addMonths(new Date(paymentData.startDate), paymentData.numberOfPayments), 'yyyy-MM-dd'),
            };
            newData.payments = newData.payments.map(item => item.id === data.id ? updatedPayment : item);
        } else if (type === 'oneTimePayment') {
            const oneTimeData = data as OneTimePayment;
            const updatedOneTimePayment: OneTimePayment = {
                ...oneTimeData,
                dueDate: format(new Date(oneTimeData.dueDate), 'yyyy-MM-dd'),
            };
            newData.oneTimePayments = newData.oneTimePayments.map(item => item.id === data.id ? updatedOneTimePayment : item);
        }
        return newData;
    });

    toast({ title: t('common.success'), description: t('toasts.itemUpdated') });
    setTransactionToEdit(null);
  }, [toast, t]);


  const handleDeleteTransaction = useCallback((type: TransactionType, id: string) => {
    const typeMap = {
      income: t('common.income'),
      expense: t('common.expense'),
      payment: t('common.recurringPayment'),
      oneTimePayment: t('common.oneTimePayment'),
    }
    setProfileData(prevData => {
        const newData = { ...prevData };
        if (type === 'income') {
            newData.income = newData.income.filter(item => item.id !== id);
        } else if (type === 'expense') {
            newData.expenses = newData.expenses.filter(item => item.id !== id);
        } else if (type === 'payment'){
            newData.payments = newData.payments.filter(item => item.id !== id);
        } else { // oneTimePayment
            newData.oneTimePayments = newData.oneTimePayments.filter(item => item.id !== id);
        }
        return newData;
    });
    toast({ title: t('common.success'), description: t('toasts.itemRemoved', {item: typeMap[type]}) });
  }, [toast, t]);

  const handleBalanceChange = (newBalance: number) => {
    setProfileData(prev => ({ ...prev, currentBalance: newBalance }));
  };

  const handleExport = useCallback(() => {
    const allProfileData: Record<string, ProfileData> = {};
    profiles.forEach(p => {
        allProfileData[p] = getFromStorage(`fintrack_data_${p}`, emptyProfileData);
    });
    
    const appSettings: AppSettings = { language, currency, geminiApiKey: geminiApiKey || '' };

    const exportData: FullAppData = {
        profiles,
        activeProfile,
        profileData: allProfileData,
        settings: appSettings,
    };

    exportToJson(exportData);
    toast({ title: t('toasts.exportSuccessTitle'), description: t('toasts.exportSuccessDescription') });
  }, [profiles, activeProfile, t, toast, language, currency, geminiApiKey]);
  
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
        const existingProfiles = getFromStorage('fintrack_profiles', []);
        existingProfiles.forEach((p: string) => localStorage.removeItem(`fintrack_data_${p}`));

        // Set new data
        setProfiles(parsedData.profiles);
        setActiveProfile(parsedData.activeProfile);
        Object.entries(parsedData.profileData).forEach(([profileName, data]) => {
            localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(data));
        });
        
        // Apply settings
        if (parsedData.settings) {
            if (parsedData.settings.language) setLanguage(parsedData.settings.language);
            if (parsedData.settings.currency) setCurrency(parsedData.settings.currency);
            if (parsedData.settings.geminiApiKey) setGeminiApiKey(parsedData.settings.geminiApiKey);
        }

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

  if (!isMounted) {
    return null; // Render nothing on the server and on the initial client-side render
  }
  
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
        <SummaryCards data={summaryData} onBalanceChange={handleBalanceChange} />
        
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
         <div className="space-y-4 md:space-y-8">
            <SmartInsightCard profileData={profileData} />
            <AboutCard />
         </div>
      </main>
    </div>
  );
}
