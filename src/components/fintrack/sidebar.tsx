
"use client";

import React from 'react';
import { useSettings } from '@/hooks/use-settings';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Wallet, Home, LineChart, Banknote, Target, Settings, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import type { FintrackView } from '@/types/fintrack';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


interface SidebarNavProps {
  setActiveView: (view: FintrackView) => void;
  isMobile?: boolean;
  isCollapsed?: boolean;
  toggleSidebar?: () => void;
}

export function SidebarNav({ setActiveView, isMobile = false, isCollapsed = false, toggleSidebar }: SidebarNavProps) {
  const { t } = useSettings();

  const navItems: { view: FintrackView, label: string, icon: React.ElementType }[] = [
    { view: 'dashboard', label: t('navigation.dashboard'), icon: Home },
    { view: 'transactions', label: t('navigation.transactions'), icon: Banknote },
    { view: 'savings', label: t('navigation.savings'), icon: Target },
    { view: 'reports', label: t('navigation.reports'), icon: LineChart },
    { view: 'settings', label: t('navigation.settings'), icon: Settings },
  ];

  const renderNavItem = (item: { view: FintrackView, label: string, icon: React.ElementType }) => {
    const navButton = (
      <Button
        variant="ghost"
        className={cn(
            "w-full h-10 px-2",
            isCollapsed ? "justify-center" : "justify-start"
        )}
        onClick={() => setActiveView(item.view)}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span className={cn("ml-2", isCollapsed && "sr-only")}>{item.label}</span>
      </Button>
    );

    if (isCollapsed) {
      return (
        <TooltipProvider>
            <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                    {navButton}
                </TooltipTrigger>
                <TooltipContent side="right">
                    <p>{item.label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
      );
    }
    
    return navButton;
  }

  return (
    <div className="flex h-full max-h-screen flex-col">
       <div className={cn("flex h-14 items-center border-b lg:h-[60px]", isCollapsed ? "justify-center px-2" : "px-4 lg:px-6")}>
        <a href="/" className="flex items-center font-semibold text-foreground">
            <Wallet className={cn("h-6 w-6 shrink-0 text-primary")} />
            <span className={cn("font-bold", isCollapsed ? "sr-only" : "ml-2")}>
            {t('appTitle')}
            </span>
        </a>
      </div>
      <div className="flex-1 overflow-y-auto" id="tour-step-2-navigation">
        <nav className={cn("grid items-start gap-1 px-2 text-sm font-medium lg:px-4", isMobile ? 'py-4' : 'py-2')}>
          {navItems.map(item => (
            <React.Fragment key={item.view}>
                {renderNavItem(item)}
            </React.Fragment>
          ))}
        </nav>
      </div>
      {!isMobile && (
        <div className="mt-auto shrink-0 border-t p-2">
            <Button variant="ghost" size="icon" className="w-full" onClick={toggleSidebar}>
                {isCollapsed ? <ChevronRight className="h-4 w-4"/> : <ChevronLeft className="h-4 w-4" />}
                <span className="sr-only">Toggle Sidebar</span>
            </Button>
        </div>
      )}
    </div>
  );
}
