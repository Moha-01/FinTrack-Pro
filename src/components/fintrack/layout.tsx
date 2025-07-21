"use client";

import { useState } from 'react';
import type { FintrackView } from '@/types/fintrack';
import { SidebarNav } from './sidebar';
import { Dashboard } from './dashboard';

export function FintrackLayout() {
  const [activeView, setActiveView] = useState<FintrackView>('dashboard');
  
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <SidebarNav setActiveView={setActiveView} isMobile={false} />
      </div>
      <div className="flex flex-col">
        <Dashboard activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  );
}
