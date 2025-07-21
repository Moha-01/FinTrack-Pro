
"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ProfileData, Income, Expense, RecurringPayment, OneTimePayment, TransactionType, AnyTransaction, FullAppData, AppSettings, SavingsGoal, SavingsAccount } from '@/types/fintrack';
import { exportToJson, parseImportedJson } from '@/lib/json-helpers';
import { generatePdfReport } from '@/lib/pdf-generator';

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
import { LoadingSpinner } from './loading-spinner';
import { CashflowTrendChart } from './cashflow-trend-chart';
import { IncomeBreakdownChart } from './income-breakdown-chart';
import { SavingsGoalsCard } from './savings-goals-card';
import { AddGoalDialog } from './add-goal-dialog';
import { SavingsAccountsCard } from './savings-accounts-card';
import { AddSavingsAccountDialog } from './add-savings-account-dialog';

const emptyProfileData: ProfileData = {
  income: [],
  expenses: [],
  payments: [],
  oneTimePayments: [],
  currentBalance: 0,
  savingsGoals: [],
  savingsAccounts: [],
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
  const { t, setLanguage, setCurrency, setGeminiApiKey, language, currency, geminiApiKey, formatCurrency } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  
  const [profiles, setProfiles] = useState<string[]>(['Standard']);
  const [activeProfile, setActiveProfile] = useState<string>('Standard');
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfileData);
  const { income, expenses, payments, oneTimePayments, currentBalance, savingsGoals, savingsAccounts } = profileData;

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  
  const [transactionToEdit, setTransactionToEdit] = useState<AnyTransaction | null>(null);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<SavingsAccount | null>(null);

  const expenseChartRef = useRef<HTMLDivElement>(null);
  const incomeChartRef = useRef<HTMLDivElement>(null);
  const cashflowChartRef = useRef<HTMLDivElement>(null);
  const projectionChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProfiles = getFromStorage('fintrack_profiles', ['Standard']);
    const savedActiveProfile = getFromStorage('fintrack_activeProfile', 'Standard');
    
    setProfiles(savedProfiles);
    const currentActiveProfile = savedProfiles.includes(savedActiveProfile) ? savedActiveProfile : savedProfiles[0] || 'Standard';
    setActiveProfile(currentActiveProfile);

    const loadedData = getFromStorage(`fintrack_data_${currentActiveProfile}`, emptyProfileData);
    // Ensure new properties are always arrays to prevent crashes with old data
    loadedData.savingsGoals = (loadedData.savingsGoals || []).map((g, index) => ({ ...g, priority: g.priority ?? index }));
    loadedData.savingsAccounts = loadedData.savingsAccounts || [];
    setProfileData(loadedData);

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
      const loadedData = getFromStorage(`fintrack_data_${activeProfile}`, emptyProfileData);
       // Ensure new properties are always arrays
      loadedData.savingsGoals = (loadedData.savingsGoals || []).map((g, index) => ({ ...g, priority: g.priority ?? index }));
      loadedData.savingsAccounts = loadedData.savingsAccounts || [];
      setProfileData(loadedData);
    }
  }, [activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted) {
      // Ensure new properties are not undefined when loading old data
      const dataToSave = {
        ...profileData,
        savingsGoals: profileData.savingsGoals || [],
        savingsAccounts: profileData.savingsAccounts || [],
      };
      localStorage.setItem(`fintrack_data_${activeProfile}`, JSON.stringify(dataToSave));
    }
  }, [profileData, activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted) {
      window.scrollTo(0, 0);
    }
  }, [isMounted]);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleAddTransactionClick = () => {
    setTransactionToEdit(null);
    setIsTransactionDialogOpen(true);
  };
  
  const handleAddGoalClick = () => {
    setGoalToEdit(null);
    setIsGoalDialogOpen(true);
  };
  
  const handleAddAccountClick = () => {
    setAccountToEdit(null);
    setIsAccountDialogOpen(true);
  };

  const handleEditTransactionClick = (transaction: AnyTransaction) => {
    setTransactionToEdit(transaction);
    setIsTransactionDialogOpen(true);
  };
  
  const handleEditGoalClick = (goal: SavingsGoal) => {
    setGoalToEdit(goal);
    setIsGoalDialogOpen(true);
  };
  
  const handleEditAccountClick = (account: SavingsAccount) => {
    setAccountToEdit(account);
    setIsAccountDialogOpen(true);
  };

  const handleAddTransaction = useCallback((type: TransactionType, data: any) => {
    let newTransaction: AnyTransaction | null = null;
    let toastDescription = '';
  
    setProfileData(prevData => {
      const id = crypto.randomUUID();
      const newData = { ...prevData };
  
      if (type === 'income') {
        newTransaction = { ...data, id, type };
        newData.income = [...newData.income, newTransaction as Income];
        toastDescription = t('toasts.incomeAdded');
      } else if (type === 'expense') {
        newTransaction = { ...data, id, type };
        newData.expenses = [...newData.expenses, newTransaction as Expense];
        toastDescription = t('toasts.expenseAdded');
      } else if (type === 'payment') {
        const completionDate = format(addMonths(new Date(data.startDate), data.numberOfPayments), 'yyyy-MM-dd');
        newTransaction = { ...data, id, type, startDate: format(data.startDate, 'yyyy-MM-dd'), completionDate };
        newData.payments = [...newData.payments, newTransaction as RecurringPayment];
        toastDescription = t('toasts.recurringPaymentAdded');
      } else { // oneTimePayment
        newTransaction = { ...data, id, type, dueDate: format(data.dueDate, 'yyyy-MM-dd') };
        newData.oneTimePayments = [...newData.oneTimePayments, newTransaction as OneTimePayment];
        toastDescription = t('toasts.oneTimePaymentAdded');
      }
  
      return newData;
    });
  
    if (toastDescription) {
      toast({ title: t('common.success'), description: toastDescription });
    }
  }, [t, toast]);
  
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
  }, [t, toast]);


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
  }, [t, toast]);

  const handleBalanceChange = (newBalance: number) => {
    setProfileData(prev => ({ ...prev, currentBalance: newBalance }));
  };

  const handleAddGoal = useCallback((name: string, targetAmount: number, currentAmount: number, linkedAccountId?: string) => {
    const newGoal: SavingsGoal = {
      id: crypto.randomUUID(),
      name,
      targetAmount,
      currentAmount,
      createdAt: new Date().toISOString(),
      linkedAccountId: linkedAccountId === 'none' ? undefined : linkedAccountId,
      priority: (savingsGoals || []).length, // Assign next priority
    };
    setProfileData(prev => ({
      ...prev,
      savingsGoals: [...(prev.savingsGoals || []), newGoal]
    }));
    toast({ title: t('common.success'), description: t('savingsGoals.goalAdded')});
  }, [savingsGoals, t, toast]);

  const handleUpdateGoal = useCallback((goal: SavingsGoal) => {
    setProfileData(prev => {
      const updatedGoals = prev.savingsGoals.map(g => g.id === goal.id ? goal : g);
      return { ...prev, savingsGoals: updatedGoals };
    });
    toast({ title: t('common.success'), description: t('savingsGoals.goalUpdated')});
  }, [t, toast]);

  const handleAddFundsToGoal = useCallback((goalId: string, amount: number) => {
    let description = '';
    setProfileData(prev => {
      const updatedGoals = prev.savingsGoals.map(goal => {
        if (goal.id === goalId && !goal.linkedAccountId) { // Only update un-linked goals
          const newCurrentAmount = goal.currentAmount + amount;
          description = t('savingsGoals.fundsAdded');
          return {
            ...goal,
            currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount,
          };
        }
        return goal;
      });
      return { ...prev, savingsGoals: updatedGoals };
    });
    if (description) {
      toast({ title: t('common.success'), description });
    }
  }, [t, toast]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setProfileData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter(goal => goal.id !== goalId)
    }));
    toast({ title: t('common.success'), description: t('savingsGoals.goalDeleted')});
  }, [t, toast]);
  
  const handleGoalPriorityChange = useCallback((goalId: string, direction: 'up' | 'down') => {
    setProfileData(prev => {
      const goals = [...prev.savingsGoals].sort((a,b) => a.priority - b.priority);
      const currentIndex = goals.findIndex(g => g.id === goalId);
      
      if (currentIndex === -1) return prev;
      
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (swapIndex < 0 || swapIndex >= goals.length) return prev;

      // Swap priorities
      const tempPriority = goals[currentIndex].priority;
      goals[currentIndex].priority = goals[swapIndex].priority;
      goals[swapIndex].priority = tempPriority;
      
      return { ...prev, savingsGoals: goals };
    });
    toast({ title: t('common.success'), description: t('savingsGoals.priorityUpdated') });
  }, [t, toast]);

  const handleAddAccount = useCallback((name: string, amount: number, interestRate?: number) => {
    const newAccount: SavingsAccount = {
      id: crypto.randomUUID(),
      name,
      amount,
      interestRate,
    };
    setProfileData(prev => ({
      ...prev,
      savingsAccounts: [...(prev.savingsAccounts || []), newAccount]
    }));
    toast({ title: t('common.success'), description: t('savingsAccounts.accountAdded') });
  }, [t, toast]);
  
  const handleUpdateAccount = useCallback((account: SavingsAccount) => {
     setProfileData(prev => ({
      ...prev,
      savingsAccounts: prev.savingsAccounts.map(a => a.id === account.id ? account : a)
    }));
    toast({ title: t('common.success'), description: t('savingsAccounts.accountUpdated') });
  }, [t, toast]);

  const handleDeleteAccount = useCallback((accountId: string) => {
    setProfileData(prev => ({
      ...prev,
      // Also unlink any goals that were linked to this account
      savingsGoals: prev.savingsGoals.map(g => g.linkedAccountId === accountId ? {...g, linkedAccountId: undefined} : g),
      savingsAccounts: prev.savingsAccounts.filter(account => account.id !== accountId)
    }));
    toast({ title: t('common.success'), description: t('savingsAccounts.accountDeleted') });
  }, [t, toast]);


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
            const dataToSave = {
              ...data,
              savingsGoals: data.savingsGoals || [],
              savingsAccounts: data.savingsAccounts || [],
            };
            localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(dataToSave));
        });
        
        // Apply settings
        if (parsedData.settings) {
            if (parsedData.settings.language) setLanguage(parsedData.settings.language);
            if (parsedData.settings.currency) setCurrency(parsedData.settings.currency);
            if (parsedData.settings.geminiApiKey) setGeminiApiKey(parsedData.settings.geminiApiKey);
        }

        // Force a reload of the active profile's data into the component state
        const reloadedData = parsedData.profileData[parsedData.activeProfile];
        reloadedData.savingsGoals = (reloadedData.savingsGoals || []).map((g, index) => ({...g, priority: g.priority ?? index}));
        reloadedData.savingsAccounts = reloadedData.savingsAccounts || [];
        setProfileData(reloadedData);
        
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

  const savingsSummary = useMemo(() => {
    const totalInAccounts = (savingsAccounts || []).reduce((sum, acc) => sum + acc.amount, 0);
    const totalAllocated = (savingsGoals || [])
      .filter(g => g.linkedAccountId && g.linkedAccountId !== 'main_balance')
      .reduce((sum, g) => sum + g.targetAmount, 0);
    
    return {
      totalInAccounts,
      totalAllocated,
      totalAvailable: totalInAccounts - totalAllocated,
    }
  }, [savingsAccounts, savingsGoals]);
  
  const handlePrintReport = useCallback(() => {
    const fullData = {
      profileData: profileData,
      summaryData: summaryData
    }
    const chartRefs = {
        expenseChartRef: expenseChartRef.current,
        incomeChartRef: incomeChartRef.current,
        cashflowChartRef: cashflowChartRef.current,
        projectionChartRef: projectionChartRef.current
    };
    generatePdfReport(fullData, chartRefs, activeProfile, t, formatCurrency);
  }, [profileData, summaryData, activeProfile, t, formatCurrency]);

  if (!isMounted) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AddTransactionDialog 
        isOpen={isTransactionDialogOpen}
        onOpenChange={setIsTransactionDialogOpen}
        onAdd={handleAddTransaction}
        onUpdate={handleUpdateTransaction}
        transactionToEdit={transactionToEdit}
      />
      <AddGoalDialog
        isOpen={isGoalDialogOpen}
        onOpenChange={setIsGoalDialogOpen}
        onAddGoal={handleAddGoal}
        onUpdateGoal={handleUpdateGoal}
        goalToEdit={goalToEdit}
        accounts={savingsAccounts || []}
      />
      <AddSavingsAccountDialog
        isOpen={isAccountDialogOpen}
        onOpenChange={setIsAccountDialogOpen}
        onAddAccount={handleAddAccount}
        onUpdateAccount={handleUpdateAccount}
        accountToEdit={accountToEdit}
      />
      <DashboardHeader 
        onImportClick={handleImportClick} 
        onExport={handleExport}
        onPrintReport={handlePrintReport}
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
                onAddClick={handleAddTransactionClick}
                onEditClick={handleEditTransactionClick}
                onDelete={handleDeleteTransaction}
            />
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <SavingsGoalsCard
                goals={savingsGoals || []}
                accounts={savingsAccounts || []}
                currentBalance={currentBalance}
                onAddGoalClick={handleAddGoalClick}
                onDeleteGoal={handleDeleteGoal}
                onUpdateGoal={handleAddFundsToGoal}
                onEditGoal={handleEditGoalClick}
                onPriorityChange={handleGoalPriorityChange}
            />
            <SavingsAccountsCard
                accounts={savingsAccounts || []}
                goals={savingsGoals || []}
                summary={savingsSummary}
                onAddAccountClick={handleAddAccountClick}
                onDeleteAccount={handleDeleteAccount}
                onEditAccount={handleEditAccountClick}
            />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <PaymentCalendar recurringPayments={payments} oneTimePayments={oneTimePayments} />
            <UpcomingPaymentsCard recurringPayments={payments} oneTimePayments={oneTimePayments} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <div ref={expenseChartRef}>
              <ExpenseBreakdownChart expenses={expenses} recurringPayments={payments} />
            </div>
            <div ref={incomeChartRef}>
              <IncomeBreakdownChart income={income} />
            </div>
        </div>

         <div className="grid grid-cols-1 gap-4 md:gap-8 lg:grid-cols-2">
            <div ref={cashflowChartRef}>
             <CashflowTrendChart 
                income={income}
                expenses={expenses}
                recurringPayments={payments}
                oneTimePayments={oneTimePayments}
            />
            </div>
            <div ref={projectionChartRef}>
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
