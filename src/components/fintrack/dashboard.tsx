

"use client";

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import type { ProfileData, Income, Expense, RecurringPayment, OneTimePayment } from '@/types/fintrack';
import { exportToJson, parseImportedJson } from '@/lib/json-helpers';

import { DashboardHeader } from './header';
import { SummaryCards } from './summary-cards';
import { ProjectionChart } from './projection-chart';
import { DataTabs } from './data-tabs';
import { ExpenseBreakdownChart } from './expense-breakdown-chart';
import { PaymentCalendar } from './payment-calendar';
import { UpcomingPaymentsCard } from './upcoming-payments';
import { addMonths, format } from 'date-fns';
import { AboutCard } from './about-card';

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
  const [profiles, setProfiles] = useState<string[]>(() => getInitialState('fintrack_profiles', ['Default']));
  const [activeProfile, setActiveProfile] = useState<string>(() => {
    const savedProfile = getInitialState('fintrack_activeProfile', 'Default');
    const allProfiles = getInitialState('fintrack_profiles', ['Default']);
    return allProfiles.includes(savedProfile) ? savedProfile : allProfiles[0] || 'Default';
  });
  
  const [profileData, setProfileData] = useState<ProfileData>(() => getInitialState(`fintrack_data_${activeProfile}`, emptyProfileData));

  const { income, expenses, payments, oneTimePayments, currentBalance } = profileData;

  useEffect(() => {
    localStorage.setItem('fintrack_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('fintrack_activeProfile', activeProfile);
    setProfileData(getInitialState(`fintrack_data_${activeProfile}`, emptyProfileData));
  }, [activeProfile]);

  useEffect(() => {
    localStorage.setItem(`fintrack_data_${activeProfile}`, JSON.stringify(profileData));
  }, [profileData, activeProfile]);
  
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const setIncome = (updater: React.SetStateAction<Income[]>) => setProfileData(p => ({...p, income: typeof updater === 'function' ? updater(p.income) : updater }));
  const setExpenses = (updater: React.SetStateAction<Expense[]>) => setProfileData(p => ({...p, expenses: typeof updater === 'function' ? updater(p.expenses) : updater }));
  const setPayments = (updater: React.SetStateAction<RecurringPayment[]>) => setProfileData(p => ({...p, payments: typeof updater === 'function' ? updater(p.payments) : updater }));
  const setOneTimePayments = (updater: React.SetStateAction<OneTimePayment[]>) => setProfileData(p => ({...p, oneTimePayments: typeof updater === 'function' ? updater(p.oneTimePayments) : updater }));
  const setCurrentBalance = (updater: React.SetStateAction<number>) => setProfileData(p => ({...p, currentBalance: typeof updater === 'function' ? updater(p.currentBalance) : updater }));


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
    const allProfileData: Record<string, ProfileData> = {};
    profiles.forEach(p => {
        allProfileData[p] = getInitialState(`fintrack_data_${p}`, emptyProfileData);
    });
    
    exportToJson({
        profiles,
        activeProfile,
        profileData: allProfileData
    });
    toast({ title: 'Export erfolgreich', description: `Alle Profile wurden heruntergeladen.` });
  }, [profiles, activeProfile]);
  
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
        
        toast({ title: 'Import erfolgreich', description: `Alle Profile wurden erfolgreich importiert.` });
      } else {
        toast({ variant: 'destructive', title: 'Import fehlgeschlagen', description: 'Datei konnte nicht verarbeitet werden. Bitte prüfen Sie das Format.' });
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
      toast({ variant: 'destructive', title: 'Fehler', description: 'Profilname ist ungültig oder existiert bereits.' });
      return;
    }
    const newProfiles = [...profiles, profileName];
    setProfiles(newProfiles);
    setActiveProfile(profileName);
    localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(emptyProfileData));
    toast({ title: 'Erfolg', description: `Profil "${profileName}" erstellt.`});
  };

  const handleDeleteProfile = (profileName: string) => {
    if (profileName === 'Default' || profiles.length <= 1) {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Das Standardprofil kann nicht gelöscht werden, oder es ist das einzige Profil.' });
      return;
    }
    const newProfiles = profiles.filter(p => p !== profileName);
    setProfiles(newProfiles);
    localStorage.removeItem(`fintrack_data_${profileName}`);
    
    if (activeProfile === profileName) {
      setActiveProfile(newProfiles[0]);
    }
    toast({ title: 'Erfolg', description: `Profil "${profileName}" gelöscht.`});
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
        <div className="grid grid-cols-1 items-start gap-4 md:gap-8 lg:grid-cols-5">
            {/* Main content - middle column on desktop, first on mobile */}
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-3 lg:row-start-1">
                 <DataTabs
                  income={income}
                  expenses={expenses}
                  payments={payments}
                  oneTimePayments={oneTimePayments}
                  onAdd={handleAddTransaction}
                  onDelete={handleDeleteTransaction}
                />
                 <PaymentCalendar recurringPayments={payments} oneTimePayments={oneTimePayments} />
                 <UpcomingPaymentsCard recurringPayments={payments} oneTimePayments={oneTimePayments} />
            </div>
            {/* Side content - side column on desktop, last on mobile */}
            <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2 lg:row-start-1">
                 <ProjectionChart
                    currentBalance={currentBalance}
                    income={income}
                    expenses={expenses}
                    recurringPayments={payments}
                    oneTimePayments={oneTimePayments}
                />
                <ExpenseBreakdownChart expenses={expenses} recurringPayments={payments} />
                <AboutCard />
            </div>
        </div>
      </main>
    </div>
  );
}
