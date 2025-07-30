
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Upload, Plus } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from "@/hooks/use-toast";
import { parseImportedJson } from '@/lib/json-helpers';
import { useTheme } from "next-themes"

const emptyProfileData: ProfileData = {
  income: [],
  oneTimeIncomes: [],
  expenses: [],
  payments: [],
  oneTimePayments: [],
  currentBalance: 0,
  savingsGoals: [],
  savingsAccounts: [],
};

interface InitialSetupDialogProps {
  onSetupComplete: () => void;
}

export function InitialSetupDialog({ onSetupComplete }: InitialSetupDialogProps) {
  const { t, language, setLanguage, currency, setCurrency, setGeminiApiKey } = useSettings();
  const { theme, setTheme } = useTheme();
  const [profileName, setProfileName] = useState('');
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim()) {
      const name = profileName.trim();
      localStorage.setItem('fintrack_profiles', JSON.stringify([name]));
      localStorage.setItem('fintrack_activeProfile', name);
      localStorage.setItem(`fintrack_data_${name}`, JSON.stringify(emptyProfileData));
      toast({ title: t('common.success'), description: t('toasts.profileCreated', { profileName: name }) });
      onSetupComplete();
    }
  };

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
        localStorage.setItem('fintrack_profiles', JSON.stringify(parsedData.profiles));
        localStorage.setItem('fintrack_activeProfile', parsedData.activeProfile);
        Object.entries(parsedData.profileData).forEach(([profileName, data]) => {
            const dataToSave = {
              ...data,
              oneTimeIncomes: data.oneTimeIncomes || [],
              savingsGoals: data.savingsGoals || [],
              savingsAccounts: data.savingsAccounts || [],
            };
            localStorage.setItem(`fintrack_data_${profileName}`, JSON.stringify(dataToSave));
        });
        
        if (parsedData.settings) {
            if (parsedData.settings.language) setLanguage(parsedData.settings.language);
            if (parsedData.settings.currency) setCurrency(parsedData.settings.currency);
            if (parsedData.settings.geminiApiKey) setGeminiApiKey(parsedData.settings.geminiApiKey);
        }
        
        toast({ title: t('toasts.importSuccessTitle'), description: t('toasts.importSuccessDescription') });
        onSetupComplete();
      } else {
        toast({ variant: 'destructive', title: t('toasts.importFailedTitle'), description: t('toasts.importFailedDescription') });
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
       <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileImport}
        className="hidden"
        accept=".json"
      />
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">{t('initialSetup.title')}</CardTitle>
          <CardDescription className="text-center">{t('initialSetup.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="font-semibold text-center">{t('settings.title')}</h3>
                <div className="flex items-center justify-between">
                    <Label>{t('settings.language')}</Label>
                    <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'de')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between">
                    <Label>{t('settings.currency')}</Label>
                    <Select value={currency} onValueChange={(val) => setCurrency(val as 'EUR' | 'USD' | 'GBP')}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="EUR">€ EUR</SelectItem>
                            <SelectItem value="USD">$ USD</SelectItem>
                            <SelectItem value="GBP">£ GBP</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center justify-between">
                    <Label>{t('settings.toggleTheme')}</Label>
                    <div className="flex items-center gap-1 rounded-lg border p-1">
                        <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')}>{t('settings.light')}</Button>
                        <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>{t('settings.dark')}</Button>
                        <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('system')}>{t('settings.system')}</Button>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="profile-name">{t('initialSetup.profileNameLabel')}</Label>
                    <Input
                        id="profile-name"
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        placeholder={t('initialSetup.profileNamePlaceholder')}
                        required
                        autoFocus
                    />
                </div>
                <Button type="submit" className="w-full" disabled={!profileName.trim()}>
                     <Plus className="mr-2 h-4 w-4" />
                     {t('initialSetup.startButton')}
                </Button>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('initialSetup.or')}</span>
                </div>
            </div>

            <Button onClick={handleImportClick} variant="outline" className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {t('initialSetup.importData')}
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

    