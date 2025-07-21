
"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

interface InitialSetupDialogProps {
  onSubmit: (profileName: string) => void;
}

export function InitialSetupDialog({ onSubmit }: InitialSetupDialogProps) {
  const { t } = useSettings();
  const [profileName, setProfileName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileName.trim()) {
      onSubmit(profileName.trim());
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Wallet className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-center">{t('initialSetup.title')}</CardTitle>
            <CardDescription className="text-center">{t('initialSetup.description')}</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={!profileName.trim()}>
              {t('initialSetup.startButton')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
