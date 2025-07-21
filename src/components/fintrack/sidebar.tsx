"use client";

import React from 'react';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Wallet, Home, LineChart, Banknote, Target, Settings, Info } from 'lucide-react';
import type { FintrackView } from '@/types/fintrack';
import { AboutCard } from './about-card';

interface SidebarNavProps {
  setActiveView: (view: FintrackView) => void;
  isMobile?: boolean;
}

export function SidebarNav({ setActiveView, isMobile = false }: SidebarNavProps) {
  const { t } = useSettings();

  const navItems: { view: FintrackView, label: string, icon: React.ElementType }[] = [
    { view: 'dashboard', label: t('navigation.dashboard'), icon: Home },
    { view: 'transactions', label: t('navigation.transactions'), icon: Banknote },
    { view: 'savings', label: t('navigation.savings'), icon: Target },
    { view: 'reports', label: t('navigation.reports'), icon: LineChart },
    { view: 'settings', label: t('navigation.settings'), icon: Settings },
  ];

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="">{t('appTitle')}</span>
        </a>
      </div>
      <div className="flex-1">
        <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isMobile && 'py-4')}>
          {navItems.map(item => (
            <Button
              key={item.view}
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => setActiveView(item.view)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>
    </div>
  );
}
