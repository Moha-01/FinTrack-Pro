
"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ProfileData, Income, Expense, RecurringPayment, OneTimePayment, TransactionType, AnyTransaction, FullAppData, AppSettings, SavingsGoal, SavingsAccount, FintrackView } from '@/types/fintrack';
import { exportToJson, parseImportedJson } from '@/lib/json-helpers';
import { generatePdfReport } from '@/lib/pdf-generator';

import { DashboardHeader } from './header';
import { addMonths, format } from 'date-fns';
import { useSettings } from '@/hooks/use-settings';
import { AddTransactionDialog } from './add-transaction-dialog';
import { LoadingSpinner } from './loading-spinner';
import { AddGoalDialog } from './add-goal-dialog';
import { AddSavingsAccountDialog } from './add-savings-account-dialog';
import { RenameProfileDialog } from './rename-profile-dialog';
import { DashboardView } from './views/dashboard-view';
import { TransactionsView } from './views/transactions-view';
import { SavingsView } from './views/savings-view';
import { ReportsView } from './views/reports-view';
import { SettingsView } from './views/settings-view';
import { TransactionDetailsDialog } from './transaction-details-dialog';

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

interface DashboardProps {
    activeView: FintrackView;
    setActiveView: (view: FintrackView) => void;
}

export function Dashboard({ activeView, setActiveView }: DashboardProps) {
  const { t, language, currency, geminiApiKey, formatCurrency } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  
  const [profiles, setProfiles] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState<string>('');
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfileData);
  const { income, expenses, payments, oneTimePayments, currentBalance, savingsGoals, savingsAccounts } = profileData;

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const [transactionToEdit, setTransactionToEdit] = useState<AnyTransaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<AnyTransaction | null>(null);
  const [goalToEdit, setGoalToEdit] = useState<SavingsGoal | null>(null);
  const [accountToEdit, setAccountToEdit] = useState<SavingsAccount | null>(null);

  const { toast, dismiss } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedProfiles = getFromStorage<string[]>('fintrack_profiles', []);
    const savedActiveProfile = getFromStorage('fintrack_activeProfile', savedProfiles.length > 0 ? savedProfiles[0] : '');
    
    setProfiles(savedProfiles);
    const currentActiveProfile = savedProfiles.includes(savedActiveProfile) ? savedActiveProfile : (savedProfiles.length > 0 ? savedProfiles[0] : '');
    setActiveProfile(currentActiveProfile);

    if (currentActiveProfile) {
      const loadedData = getFromStorage(`fintrack_data_${currentActiveProfile}`, emptyProfileData);
      loadedData.savingsGoals = (loadedData.savingsGoals || []).map((g, index) => ({ ...g, priority: g.priority ?? index }));
      loadedData.savingsAccounts = loadedData.savingsAccounts || [];
      setProfileData(loadedData);
    }

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('fintrack_profiles', JSON.stringify(profiles));
    }
  }, [profiles, isMounted]);

  useEffect(() => {
    if (isMounted && activeProfile) {
      localStorage.setItem('fintrack_activeProfile', activeProfile);
      const loadedData = getFromStorage(`fintrack_data_${activeProfile}`, emptyProfileData);
       // Ensure new properties are always arrays
      loadedData.savingsGoals = (loadedData.savingsGoals || []).map((g, index) => ({...g, priority: g.priority ?? index}));
      loadedData.savingsAccounts = loadedData.savingsAccounts || [];
      setProfileData(loadedData);
    }
  }, [activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted && activeProfile) {
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
  }, [isMounted, activeView]);
  
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

  const handleShowTransactionDetails = (transaction: AnyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  };
  
  const handleEditGoalClick = (goal: SavingsGoal) => {
    setGoalToEdit(goal);
    setIsGoalDialogOpen(true);
  };
  
  const handleEditAccountClick = (account: SavingsAccount) => {
    setAccountToEdit(account);
    setIsAccountDialogOpen(true);
  };
  
  const handleRenameProfileClick = () => {
    setIsRenameDialogOpen(true);
  };

  const handleAddTransaction = useCallback((type: TransactionType, data: Omit<AnyTransaction, 'id' | 'type'>) => {
    let newTransaction: AnyTransaction | null = null;
    const id = crypto.randomUUID();

    setProfileData(prevData => {
      const newData = { ...prevData };
      if (type === 'income') {
        newTransaction = { ...data, id, type } as Income;
        newData.income = [...newData.income, newTransaction];
      } else if (type === 'expense') {
        newTransaction = { ...data, id, type } as Expense;
        newData.expenses = [...newData.expenses, newTransaction];
      } else if (type === 'payment') {
        const paymentData = data as Omit<RecurringPayment, 'id' | 'type' | 'completionDate'>;
        const completionDate = format(addMonths(new Date(paymentData.startDate), paymentData.numberOfPayments), 'yyyy-MM-dd');
        newTransaction = { ...paymentData, id, type, startDate: format(new Date(paymentData.startDate), 'yyyy-MM-dd'), completionDate };
        newData.payments = [...newData.payments, newTransaction as RecurringPayment];
      } else { // oneTimePayment
        const oneTimeData = data as Omit<OneTimePayment, 'id' | 'type'>;
        newTransaction = { ...oneTimeData, id, type, dueDate: format(new Date(oneTimeData.dueDate), 'yyyy-MM-dd') };
        newData.oneTimePayments = [...newData.oneTimePayments, newTransaction as OneTimePayment];
      }
      return newData;
    });

    let toastDescription = '';
    if (type === 'income') toastDescription = t('toasts.incomeAdded');
    else if (type === 'expense') toastDescription = t('toasts.expenseAdded');
    else if (type === 'payment') toastDescription = t('toasts.recurringPaymentAdded');
    else toastDescription = t('toasts.oneTimePaymentAdded');
    toast({ title: t('common.success'), description: toastDescription });
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
    
    const typeMap = {
      income: t('common.income'),
      expense: t('common.expense'),
      payment: t('common.recurringPayment'),
      oneTimePayment: t('common.oneTimePayment'),
    };
    toast({ title: t('common.success'), description: t('toasts.itemRemoved', {item: typeMap[type]})});
  }, [t, toast]);

  const handleBalanceChange = (newBalance: number) => {
    setProfileData(prev => ({ ...prev, currentBalance: newBalance }));
  };

  const handleAddGoal = useCallback((name: string, targetAmount: number, currentAmount: number, linkedAccountId?: string) => {
    setProfileData(prev => {
      const newGoal: SavingsGoal = {
        id: crypto.randomUUID(),
        name,
        targetAmount,
        currentAmount,
        createdAt: new Date().toISOString(),
        linkedAccountId: linkedAccountId === 'none' ? undefined : linkedAccountId,
        priority: (prev.savingsGoals || []).length,
      };
      return {
        ...prev,
        savingsGoals: [...(prev.savingsGoals || []), newGoal]
      };
    });
    toast({ title: t('common.success'), description: t('savingsGoals.goalAdded')});
  }, [t, toast]);

  const handleUpdateGoal = useCallback((goal: SavingsGoal) => {
    setProfileData(prev => {
      const updatedGoals = prev.savingsGoals.map(g => g.id === goal.id ? goal : g);
      return { ...prev, savingsGoals: updatedGoals };
    });
    toast({ title: t('common.success'), description: t('savingsGoals.goalUpdated')});
  }, [t, toast]);

  const handleAddFundsToGoal = useCallback((goalId: string, amount: number) => {
    setProfileData(prev => {
      const updatedGoals = prev.savingsGoals.map(goal => {
        if (goal.id === goalId && !goal.linkedAccountId) { // Only update un-linked goals
          const newCurrentAmount = goal.currentAmount + amount;
          return {
            ...goal,
            currentAmount: newCurrentAmount > goal.targetAmount ? goal.targetAmount : newCurrentAmount,
          };
        }
        return goal;
      });
      return { ...prev, savingsGoals: updatedGoals };
    });
    toast({ title: t('common.success'), description: t('savingsGoals.fundsAdded') });
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
      const goals = [...prev.savingsGoals].sort((a, b) => a.priority - b.priority);
      const currentIndex = goals.findIndex(g => g.id === goalId);

      if (currentIndex === -1) return prev;
      
      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (swapIndex < 0 || swapIndex >= goals.length) return prev;

      // Move the element in the array
      const [movedGoal] = goals.splice(currentIndex, 1);
      goals.splice(swapIndex, 0, movedGoal);
      
      // Re-assign all priorities based on the new order
      const updatedGoals = goals.map((goal, index) => ({
        ...goal,
        priority: index,
      }));
      
      return { ...prev, savingsGoals: updatedGoals };
    });
    toast({ title: t('common.success'), description: t('savingsGoals.priorityUpdated') });
  }, [t, toast]);

  const handleAddAccount = useCallback((name: string, amount: number, interestRate?: number) => {
    setProfileData(prev => {
      const newAccount: SavingsAccount = {
        id: crypto.randomUUID(),
        name,
        amount,
        interestRate,
      };
      return {
        ...prev,
        savingsAccounts: [...(prev.savingsAccounts || []), newAccount]
      };
    });
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
            if (parsedData.settings.language) localStorage.setItem('fintrack_language', parsedData.settings.language);
            if (parsedData.settings.currency) localStorage.setItem('fintrack_currency', parsedData.settings.currency);
            if (parsedData.settings.geminiApiKey) localStorage.setItem('fintrack_geminiApiKey', parsedData.settings.geminiApiKey);
        }
        
        // Force a reload of the page to apply all settings and data
        window.location.reload();
        
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
    if (profiles.length <= 1) {
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

  const handleRenameProfile = (oldName: string, newName: string) => {
    if (!newName || profiles.includes(newName)) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('toasts.profileInvalid') });
      return false;
    }

    // Update profile list
    const newProfiles = profiles.map(p => p === oldName ? newName : p);
    setProfiles(newProfiles);

    // Rename data in localStorage
    const profileDataToMove = localStorage.getItem(`fintrack_data_${oldName}`);
    if (profileDataToMove) {
        localStorage.setItem(`fintrack_data_${newName}`, profileDataToMove);
        localStorage.removeItem(`fintrack_data_${oldName}`);
    }

    // Update active profile if it was the one renamed
    if (activeProfile === oldName) {
      setActiveProfile(newName);
    }
    
    toast({ title: t('common.success'), description: t('toasts.profileRenamed', { oldName, newName }) });
    return true;
  };
  
  const handleResetApp = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Get all keys from localStorage
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fintrack_')) {
            keysToRemove.push(key);
        }
    }
    
    // Remove all keys related to the app
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Reload the page to go back to the initial state
    window.location.reload();
  }, []);
  
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

  const handlePrintReport = useCallback(async () => {
    setIsPrinting(true);
    const { id } = toast({
      title: t('pdf.generatingTitle'),
      description: t('pdf.generatingDesc'),
    });

    try {
        await generatePdfReport(
            { profileData, summaryData },
            activeProfile,
            t,
            formatCurrency
        );
    } catch(e) {
        console.error("Failed to generate PDF", e);
    } finally {
        dismiss(id);
        setIsPrinting(false);
    }
  }, [profileData, summaryData, activeProfile, t, formatCurrency, toast, dismiss]);

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
  
  if (!isMounted) {
    return <LoadingSpinner />;
  }
  
  const fileInput = (
    <input
      type="file"
      ref={fileInputRef}
      onChange={handleFileImport}
      className="hidden"
      accept=".json"
    />
  );
  
  const renderActiveView = () => {
    switch(activeView) {
      case 'dashboard':
        return <DashboardView summaryData={summaryData} profileData={profileData} onBalanceChange={handleBalanceChange} onAddTransactionClick={handleAddTransactionClick} onPaymentClick={handleShowTransactionDetails}/>;
      case 'transactions':
        return <TransactionsView profileData={profileData} onAddClick={handleAddTransactionClick} onEditClick={handleEditTransactionClick} onDelete={handleDeleteTransaction} onRowClick={handleShowTransactionDetails} />;
      case 'savings':
          return <SavingsView profileData={profileData} savingsSummary={savingsSummary} onAddGoalClick={handleAddGoalClick} onAddAccountClick={handleAddAccountClick} onEditGoalClick={handleEditGoalClick} onEditAccountClick={handleEditAccountClick} onDeleteGoal={handleDeleteGoal} onDeleteAccount={handleDeleteAccount} onAddFundsToGoal={handleAddFundsToGoal} onGoalPriorityChange={handleGoalPriorityChange} />;
      case 'reports':
        return <ReportsView profileData={profileData} />;
      case 'settings':
          return <SettingsView onResetApp={handleResetApp} />;
      default:
        return <DashboardView summaryData={summaryData} profileData={profileData} onBalanceChange={handleBalanceChange} onAddTransactionClick={handleAddTransactionClick} onPaymentClick={handleShowTransactionDetails}/>;
    }
  }

  return (
    <div className="flex flex-col h-screen">
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
      <RenameProfileDialog
        isOpen={isRenameDialogOpen}
        onOpenChange={setIsRenameDialogOpen}
        currentName={activeProfile}
        onRename={handleRenameProfile}
        profiles={profiles}
      />
      <TransactionDetailsDialog
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        transaction={selectedTransaction}
      />
      <DashboardHeader 
        onImportClick={handleImportClick} 
        onExport={handleExport}
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileChange={handleProfileChange}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
        onRenameProfile={handleRenameProfileClick}
        onPrintReport={handlePrintReport}
        isPrinting={isPrinting}
        setActiveView={setActiveView}
      />
      
      {fileInput}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:gap-8 md:p-8 space-y-4 md:space-y-8">
        {renderActiveView()}
      </main>
    </div>
  );
}
