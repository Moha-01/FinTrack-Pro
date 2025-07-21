"use client";

import React, { useState, useEffect } from 'react';
import type { FintrackView } from '@/types/fintrack';
import { SidebarNav } from './sidebar';
import { Dashboard } from './dashboard';
import { cn } from '@/lib/utils';

export function FintrackLayout() {
  const [activeView, setActiveView] = useState<FintrackView>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
      <div className="flex flex-col">
        <Dashboard activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  );
}
