
"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ProfileData, Transaction, FullAppData, AppSettings, SavingsGoal, SavingsAccount, FintrackView, InterestRateEntry } from '@/types/fintrack';
import { exportToJson, parseAndValidateImportedJson } from '@/lib/json-helpers';
import { generatePdfReport } from '@/lib/pdf-generator';
import { demoProfileData } from '@/lib/demo-data';

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
import { AboutView } from './views/about-view';
import { TransactionDetailsDialog } from './transaction-details-dialog';
import { DuplicateProfileDialog } from './duplicate-profile-dialog';

const emptyProfileData: ProfileData = {
  transactions: [],
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
  const { t, language, currency, geminiApiKey, setLanguage, setCurrency, setGeminiApiKey, formatCurrency } = useSettings();
  const [isMounted, setIsMounted] = useState(false);
  
  const [profiles, setProfiles] = useState<string[]>([]);
  const [activeProfile, setActiveProfile] = useState<string>('');
  const [profileData, setProfileData] = useState<ProfileData>(emptyProfileData);

  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
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

    setIsMounted(true);
  }, []);

  useEffect(() => {
      if (isMounted && activeProfile) {
          const loadedData = getFromStorage(`fintrack_data_${activeProfile}`, emptyProfileData);
          setProfileData(loadedData);
      }
  }, [activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('fintrack_profiles', JSON.stringify(profiles));
    }
  }, [profiles, isMounted]);

  useEffect(() => {
    if (isMounted && activeProfile) {
      localStorage.setItem('fintrack_activeProfile', activeProfile);
    }
  }, [activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted && activeProfile) {
      localStorage.setItem(`fintrack_data_${activeProfile}`, JSON.stringify(profileData));
    }
  }, [profileData, activeProfile, isMounted]);

  useEffect(() => {
    if (isMounted) {
      window.scrollTo(0, 0);
    }
  }, [isMounted, activeView]);
  
  const handleAddTransactionClick = useCallback(() => {
    setTransactionToEdit(null);
    setIsTransactionDialogOpen(true);
  }, []);
  
  const handleAddGoalClick = useCallback(() => {
    setGoalToEdit(null);
    setIsGoalDialogOpen(true);
  }, []);
  
  const handleAddAccountClick = useCallback(() => {
    setAccountToEdit(null);
    setIsAccountDialogOpen(true);
  }, []);

  const handleEditTransactionClick = useCallback((transaction: Transaction) => {
    setTransactionToEdit(transaction);
    setIsTransactionDialogOpen(true);
  }, []);

  const handleShowTransactionDetails = useCallback((transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  }, []);
  
  const handleEditGoalClick = useCallback((goal: SavingsGoal) => {
    setGoalToEdit(goal);
    setIsGoalDialogOpen(true);
  }, []);
  
  const handleEditAccountClick = useCallback((account: SavingsAccount) => {
    setAccountToEdit(account);
    setIsAccountDialogOpen(true);
  }, []);
  
  const handleRenameProfileClick = useCallback(() => {
    setIsRenameDialogOpen(true);
  }, []);
  
  const handleDuplicateProfileClick = useCallback(() => {
    setIsDuplicateDialogOpen(true);
  }, []);

  const handleAddTransaction = useCallback((data: Omit<Transaction, 'id'>) => {
    const id = crypto.randomUUID();
    let newTransaction: Transaction = { ...data, id };

    if(newTransaction.recurrence === 'monthly' && newTransaction.category === 'payment' && newTransaction.installmentDetails) {
        newTransaction.installmentDetails.completionDate = format(addMonths(new Date(newTransaction.date), newTransaction.installmentDetails.numberOfPayments), 'yyyy-MM-dd');
    }
    
    setProfileData(prev => ({
        ...prev,
        transactions: [...prev.transactions, newTransaction]
    }));
    
    let toastMessage = '';
    switch(newTransaction.category) {
        case 'income':
            toastMessage = newTransaction.recurrence === 'once' ? t('toasts.oneTimeIncomeAdded') : t('toasts.incomeAdded');
            break;
        case 'expense':
            toastMessage = t('toasts.expenseAdded');
            break;
        case 'payment':
            toastMessage = newTransaction.recurrence === 'once' ? t('toasts.oneTimePaymentAdded') : t('toasts.recurringPaymentAdded');
            break;
    }

    toast({ title: t('common.success'), description: toastMessage });
  }, [t, toast]);
  
  const handleUpdateTransaction = useCallback((data: Transaction) => {
    setProfileData(prevData => {
        let updatedTransaction = { ...data };

        if (updatedTransaction.recurrence === 'monthly' && updatedTransaction.category === 'payment' && updatedTransaction.installmentDetails) {
           updatedTransaction.installmentDetails.completionDate = format(addMonths(new Date(updatedTransaction.date), updatedTransaction.installmentDetails.numberOfPayments), 'yyyy-MM-dd');
        }

        const newTransactions = prevData.transactions.map(t => t.id === updatedTransaction.id ? updatedTransaction : t);
        return { ...prevData, transactions: newTransactions };
    });

    toast({ title: t('common.success'), description: t('toasts.itemUpdated') });
    setTransactionToEdit(null);
  }, [t, toast]);


  const handleDeleteTransaction = useCallback((id: string) => {
    const item = profileData.transactions.find(t => t.id === id);
    if (!item) return;

    setProfileData(prevData => ({
        ...prevData,
        transactions: prevData.transactions.filter(item => item.id !== id)
    }));
    
    toast({ title: t('common.success'), description: t('toasts.itemRemoved', {item: item.name})});
  }, [profileData.transactions, t, toast]);

  const handleTogglePaymentStatus = useCallback((id: string) => {
    setProfileData(prevData => {
        const newTransactions: Transaction[] = prevData.transactions.map(p => {
            if (p.id === id && p.recurrence === 'once') {
                return { ...p, status: p.status === 'pending' ? 'paid' : 'pending' };
            }
            return p;
        });
        return { ...prevData, transactions: newTransactions };
    });
    toast({ title: t('common.success'), description: t('toasts.paymentStatusUpdated') });
  }, [t, toast]);


  const handleBalanceChange = useCallback((newBalance: number) => {
    setProfileData(prev => ({ 
      ...prev, 
      currentBalance: newBalance,
    }));
  }, []);

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

  const handleAddAccount = useCallback((name: string, amount: number, interestHistory: InterestRateEntry[]) => {
    setProfileData(prev => {
      const newAccount: SavingsAccount = {
        id: crypto.randomUUID(),
        name,
        amount,
        interestHistory: interestHistory || [],
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
    
    const appSettings: AppSettings = { language, currency, geminiApiKey: geminiApiKey || null };

    const exportData: FullAppData = {
        profiles,
        activeProfile,
        profileData: allProfileData,
        settings: appSettings,
    };

    exportToJson(exportData);
    toast({ title: t('toasts.exportSuccessTitle'), description: t('toasts.exportSuccessDescription') });
  }, [profiles, activeProfile, t, toast, language, currency, geminiApiKey]);
  
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const parsedData = parseAndValidateImportedJson(content);
      
      if (parsedData) {
        const existingProfiles = getFromStorage('fintrack_profiles', []);
        existingProfiles.forEach((p: string) => localStorage.removeItem(`fintrack_data_${p}`));

        setProfiles(parsedData.profiles);
        setActiveProfile(parsedData.activeProfile);
        Object.entries(parsedData.profileData).forEach(([profileName, data]) => {
            localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(data));
        });
        
        if (parsedData.settings) {
            setLanguage(parsedData.settings.language || 'de');
            setCurrency(parsedData.settings.currency || 'EUR');
            setGeminiApiKey(parsedData.settings.geminiApiKey || null);
        }
        
        // Force a reload of the page to apply all settings and data
        window.location.reload();
      } else {
        toast({ variant: 'destructive', title: t('toasts.importFailedTitle'), description: t('toasts.importFailedDescription') });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }, [setLanguage, setCurrency, setGeminiApiKey, t, toast]);

  const handleProfileChange = useCallback((profileName: string) => {
    setActiveProfile(profileName);
  }, []);

  const handleAddProfile = useCallback((profileName: string) => {
    if (!profileName || profiles.includes(profileName)) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('toasts.profileInvalid') });
      return;
    }
    const newProfiles = [...profiles, profileName];
    setProfiles(newProfiles);
    setActiveProfile(profileName);
    setProfileData(emptyProfileData);
    toast({ title: t('common.success'), description: t('toasts.profileCreated', {profileName})});
  }, [profiles, t, toast]);

  const handleDeleteProfile = useCallback((profileName: string) => {
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
  }, [profiles, activeProfile, t, toast]);

  const handleRenameProfile = useCallback((oldName: string, newName: string) => {
    if (!newName || (profiles.includes(newName) && newName !== oldName)) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('toasts.profileInvalid') });
      return false;
    }

    const newProfiles = profiles.map(p => p === oldName ? newName : p);
    setProfiles(newProfiles);

    const profileDataToMove = localStorage.getItem(`fintrack_data_${oldName}`);
    if (profileDataToMove) {
        localStorage.setItem(`fintrack_data_${newName}`, profileDataToMove);
        localStorage.removeItem(`fintrack_data_${oldName}`);
    }

    if (activeProfile === oldName) {
      setActiveProfile(newName);
    }
    
    toast({ title: t('common.success'), description: t('toasts.profileRenamed', { oldName, newName }) });
    return true;
  }, [profiles, activeProfile, t, toast]);

  const handleDuplicateProfile = useCallback((newName: string) => {
    if (!newName || profiles.includes(newName)) {
      toast({ variant: 'destructive', title: t('common.error'), description: t('toasts.profileInvalid') });
      return false;
    }
    
    // The current profileData in state is the one to be duplicated
    const duplicatedData = JSON.stringify(profileData);
    localStorage.setItem(`fintrack_data_${newName}`, duplicatedData);
    
    const newProfiles = [...profiles, newName];
    setProfiles(newProfiles);
    setActiveProfile(newName); // Switch to the new profile
    
    toast({ title: t('common.success'), description: t('toasts.profileDuplicated', { profileName: newName }) });
    return true;
  }, [profileData, profiles, t, toast]);
  
  const handleResetApp = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fintrack_')) {
            keysToRemove.push(key);
        }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    window.location.reload();
  }, []);

  const handleLoadDemoData = useCallback(() => {
    const demoProfileName = t('settings.demoProfileName');
    
    // Create or switch to demo profile
    if (!profiles.includes(demoProfileName)) {
      const newProfiles = [...profiles, demoProfileName];
      setProfiles(newProfiles);
      setActiveProfile(demoProfileName);
    } else {
      setActiveProfile(demoProfileName);
    }
    
    // Set demo data for the demo profile
    setProfileData(demoProfileData);
    
    // Explicitly set in localStorage as setProfileData might not trigger effect in time before navigation
    localStorage.setItem(`fintrack_data_${demoProfileName}`, JSON.stringify(demoProfileData));
    
    toast({ title: t('common.success'), description: t('toasts.demoDataLoaded') });
    
    // Navigate to dashboard to see the data
    setActiveView('dashboard');
  }, [profiles, t, toast, setActiveView]);
  
  const summaryData = useMemo(() => {
    const { transactions = [], currentBalance } = profileData;
    const totalMonthlyIncome = transactions
        .filter(t => t.category === 'income' && t.recurrence !== 'once')
        .reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);

    const totalMonthlyExpenses = transactions
        .filter(t => (t.category === 'expense' || t.category === 'payment') && t.recurrence !== 'once')
        .reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);

    return {
      currentBalance,
      totalMonthlyIncome,
      totalMonthlyExpenses,
      netMonthlySavings: totalMonthlyIncome - totalMonthlyExpenses
    };
  }, [profileData]);

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
            formatCurrency,
            language
        );
    } catch(e) {
        console.error("Failed to generate PDF", e);
    } finally {
        dismiss(id);
        setIsPrinting(false);
    }
  }, [profileData, summaryData, activeProfile, t, formatCurrency, toast, dismiss, language]);

  const savingsSummary = useMemo(() => {
    const { savingsAccounts = [], savingsGoals = [] } = profileData;
    const totalInAccounts = savingsAccounts.reduce((sum, acc) => sum + acc.amount, 0);
    const totalAllocated = savingsGoals
      .filter(g => g.linkedAccountId && g.linkedAccountId !== 'main_balance')
      .reduce((sum, g) => sum + g.targetAmount, 0);
    
    return {
      totalInAccounts,
      totalAllocated,
      totalAvailable: totalInAccounts - totalAllocated,
    }
  }, [profileData]);
  
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
        return <TransactionsView profileData={profileData} onAddClick={handleAddTransactionClick} onEditClick={handleEditTransactionClick} onDelete={handleDeleteTransaction} onRowClick={handleShowTransactionDetails} onTogglePaymentStatus={handleTogglePaymentStatus} onPrintReport={handlePrintReport} isPrinting={isPrinting} />;
      case 'savings':
          return <SavingsView profileData={profileData} savingsSummary={savingsSummary} onAddGoalClick={handleAddGoalClick} onAddAccountClick={handleAddAccountClick} onEditGoalClick={handleEditGoalClick} onEditAccountClick={handleEditAccountClick} onDeleteGoal={handleDeleteGoal} onDeleteAccount={handleDeleteAccount} onAddFundsToGoal={handleAddFundsToGoal} onGoalPriorityChange={handleGoalPriorityChange} />;
      case 'reports':
        return <ReportsView profileData={profileData} />;
      case 'settings':
          return <SettingsView onResetApp={handleResetApp} onLoadDemoData={handleLoadDemoData} />;
      case 'about':
        return <AboutView />;
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
        accounts={profileData.savingsAccounts || []}
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
      <DuplicateProfileDialog
        isOpen={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
        onDuplicate={handleDuplicateProfile}
        profiles={profiles}
      />
      {selectedTransaction && (
        <TransactionDetailsDialog
          isOpen={isDetailsOpen}
          onOpenChange={setIsDetailsOpen}
          transaction={selectedTransaction}
        />
      )}
      <DashboardHeader 
        onImportClick={handleImportClick} 
        onExport={handleExport}
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileChange={handleProfileChange}
        onAddProfile={handleAddProfile}
        onDeleteProfile={handleDeleteProfile}
        onRenameProfile={handleRenameProfileClick}
        onDuplicateProfile={handleDuplicateProfileClick}
        setActiveView={setActiveView}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      
      {fileInput}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:gap-8 md:p-8 space-y-4 md:space-y-8">
        {renderActiveView()}
      </main>
    </div>
  );
}

    