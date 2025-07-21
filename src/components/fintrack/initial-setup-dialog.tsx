
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Upload, Plus } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { Separator } from '../ui/separator';

interface InitialSetupDialogProps {
  onSubmit: (profileName: string) => void;
  onImportClick: () => void;
}

export function InitialSetupDialog({ onSubmit, onImportClick }: InitialSetupDialogProps) {
  const { t } = useSettings();
  const [profileName, setProfileName] = useState('');
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim()) {
      onSubmit(profileName.trim());
    }
  };
  
  const handleStartNew = () => {
    setShowNewProfileInput(true);
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <Wallet className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-center">{t('initialSetup.title')}</CardTitle>
          <CardDescription className="text-center">{t('initialSetup.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {showNewProfileInput ? (
            <form onSubmit={handleSubmit}>
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
              <Button type="submit" className="w-full mt-4" disabled={!profileName.trim()}>
                {t('initialSetup.startButton')}
              </Button>
            </form>
          ) : (
             <div className="space-y-4">
               <Button onClick={handleStartNew} className="w-full">
                 <Plus className="mr-2 h-4 w-4" />
                 {t('initialSetup.startFresh')}
               </Button>
               <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t('initialSetup.or')}</span>
                </div>
              </div>
               <Button onClick={onImportClick} variant="outline" className="w-full">
                 <Upload className="mr-2 h-4 w-4" />
                 {t('initialSetup.importData')}
               </Button>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
