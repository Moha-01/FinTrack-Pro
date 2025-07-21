
"use client";

import React, { useState, useEffect } from 'react';
import type { FintrackView } from '@/types/fintrack';
import { SidebarNav } from './sidebar';
import { Dashboard } from './dashboard';
import { cn } from '@/lib/utils';
import { InitialSetupDialog } from './initial-setup-dialog';
import { useSettings } from '@/hooks/use-settings';
import { LoadingSpinner } from './loading-spinner';

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

export function FintrackLayout() {
  const [activeView, setActiveView] = useState<FintrackView>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInitialSetup, setIsInitialSetup] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const { setLanguage, setCurrency, setGeminiApiKey } = useSettings();

  useEffect(() => {
    const savedProfiles = getFromStorage<string[]>('fintrack_profiles', []);
    setIsInitialSetup(savedProfiles.length === 0);

    setLanguage(getFromStorage('fintrack_language', 'de'));
    setCurrency(getFromStorage('fintrack_currency', 'EUR'));
    setGeminiApiKey(localStorage.getItem('fintrack_geminiApiKey'));

    setIsMounted(true);
  }, [setCurrency, setGeminiApiKey, setLanguage]);

  useEffect(() => {
    // Check localStorage for saved collapsed state
    const savedState = localStorage.getItem('sidebar-collapsed');
    if (savedState) {
      setIsCollapsed(JSON.parse(savedState));
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
  };
  
  const handleSetupComplete = () => {
    setIsInitialSetup(false);
  }

  if (!isMounted) {
    return <LoadingSpinner />;
  }

  if (isInitialSetup) {
    return <InitialSetupDialog onSetupComplete={handleSetupComplete} />;
  }

  return (
    <div className={cn(
      "grid min-h-screen w-full",
      isCollapsed 
        ? "md:grid-cols-[56px_1fr]" 
        : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]"
    )}>
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarNav setActiveView={setActiveView} isMobile={false} isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
      </div>
      <Dashboard activeView={activeView} setActiveView={setActiveView} />
    </div>
  );
}
