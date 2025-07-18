
"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, Wallet, User, PlusCircle, Trash2, Languages, Landmark } from 'lucide-react';
import type { FC } from "react";
import React, { useState } from 'react';
import { ModeToggle } from "../mode-toggle";
import { useSettings } from "@/hooks/use-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


interface DashboardHeaderProps {
  onImportClick: () => void;
  onExport: () => void;
  profiles: string[];
  activeProfile: string;
  onProfileChange: (profileName: string) => void;
  onAddProfile: (profileName: string) => void;
  onDeleteProfile: (profileName: string) => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ 
  onImportClick, 
  onExport,
  profiles,
  activeProfile,
  onProfileChange,
  onAddProfile,
  onDeleteProfile
}) => {
  const { t } = useSettings();
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold text-foreground sm:text-xl">{t('appTitle')}</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <SettingsToggles />
        <ModeToggle />
        <ProfileManager 
          profiles={profiles}
          activeProfile={activeProfile}
          onProfileChange={onProfileChange}
          onAddProfile={onAddProfile}
          onDeleteProfile={onDeleteProfile}
        />
        <Button variant="outline" size="sm" onClick={onImportClick} className="transition-all hover:scale-105 hidden sm:inline-flex">
          <Upload className="mr-2 h-4 w-4" />
          {t('header.import')}
        </Button>
        <Button variant="outline" size="icon" onClick={onImportClick} className="transition-all hover:scale-105 sm:hidden">
            <Upload className="h-4 w-4" />
            <span className="sr-only">{t('header.import')}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="transition-all hover:scale-105 hidden sm:inline-flex">
          <Download className="mr-2 h-4 w-4" />
          {t('header.export')}
        </Button>
         <Button variant="outline" size="icon" onClick={onExport} className="transition-all hover:scale-105 sm:hidden">
            <Download className="h-4 w-4" />
            <span className="sr-only">{t('header.export')}</span>
        </Button>
      </div>
    </header>
  );
};

interface ProfileManagerProps {
  profiles: string[];
  activeProfile: string;
  onProfileChange: (profileName: string) => void;
  onAddProfile: (profileName: string) => void;
  onDeleteProfile: (profileName: string) => void;
}

const ProfileManager: FC<ProfileManagerProps> = ({ profiles, activeProfile, onProfileChange, onAddProfile, onDeleteProfile }) => {
  const [newProfileName, setNewProfileName] = useState("");
  const { t } = useSettings();

  const handleAddClick = () => {
    onAddProfile(newProfileName);
    setNewProfileName("");
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="transition-all hover:scale-105">
          <User className="mr-2 h-4 w-4" />
          <span className="hidden sm:inline">{activeProfile}</span>
          <span className="sr-only">{activeProfile}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('profileManager.switchProfile')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={activeProfile} onValueChange={onProfileChange}>
          {profiles.map(profile => (
            <DropdownMenuRadioItem key={profile} value={profile}>
              {profile}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <AlertDialog>
             <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  <span>{t('profileManager.addProfile')}</span>
                </DropdownMenuItem>
             </AlertDialogTrigger>
             <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('profileManager.addProfileTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('profileManager.addProfileDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      {t('profileManager.nameLabel')}
                    </Label>
                    <Input id="name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddClick} disabled={!newProfileName}>{t('common.add')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
           <AlertDialog>
             <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={profiles.length <= 1 || activeProfile === 'Standard'}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>{t('profileManager.deleteProfile')}</span>
                </DropdownMenuItem>
             </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                  <AlertDialogDescription>
                     {t('profileManager.deleteProfileDescription', { profileName: activeProfile })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteProfile(activeProfile)}>{t('common.delete')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
           </AlertDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const SettingsToggles: FC = () => {
    const { language, setLanguage, currency, setCurrency, t } = useSettings();

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Languages className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">{t('settings.toggleLanguage')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={language} onValueChange={(val) => setLanguage(val as 'en' | 'de')}>
                        <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Landmark className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">{t('settings.toggleCurrency')}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                     <DropdownMenuRadioGroup value={currency} onValueChange={(val) => setCurrency(val as 'EUR' | 'USD' | 'GBP')}>
                        <DropdownMenuRadioItem value="EUR">€ EUR</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="USD">$ USD</DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="GBP">£ GBP</DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    )
}
