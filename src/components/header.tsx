
"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, Wallet, User, PlusCircle, Trash2, Languages, Landmark, Settings, KeyRound } from 'lucide-react';
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
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
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
        <ProfileManager 
          profiles={profiles}
          activeProfile={activeProfile}
          onProfileChange={onProfileChange}
          onAddProfile={onAddProfile}
          onDeleteProfile={onDeleteProfile}
          onImportClick={onImportClick}
          onExport={onExport}
        />
        <SettingsMenu />
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
  onImportClick: () => void;
  onExport: () => void;
}

const ProfileManager: FC<ProfileManagerProps> = ({ profiles, activeProfile, onProfileChange, onAddProfile, onDeleteProfile, onImportClick, onExport }) => {
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
        <DropdownMenuSeparator />
         <DropdownMenuGroup>
             <DropdownMenuItem onSelect={onImportClick}>
                <Upload className="mr-2 h-4 w-4" />
                <span>{t('header.import')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onExport}>
                <Download className="mr-2 h-4 w-4" />
                <span>{t('header.export')}</span>
            </DropdownMenuItem>
         </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const SettingsMenu: FC = () => {
    const { language, setLanguage, currency, setCurrency, geminiApiKey, setGeminiApiKey, t } = useSettings();
    const [apiKey, setApiKey] = useState(geminiApiKey || '');

    const handleApiKeySave = () => {
        setGeminiApiKey(apiKey);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{t('settings.title')}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t('settings.title')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <ModeToggle />
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                          <Languages className="mr-2 h-4 w-4" />
                          <span>{t('settings.language')}</span>
                      </DropdownMenuSubTrigger>
                       <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={language} onValueChange={(val) => setLanguage(val as 'en' | 'de')}>
                                  <DropdownMenuRadioItem value="en">English</DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="de">Deutsch</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                       </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                          <Landmark className="mr-2 h-4 w-4" />
                          <span>{t('settings.currency')}</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                              <DropdownMenuRadioGroup value={currency} onValueChange={(val) => setCurrency(val as 'EUR' | 'USD' | 'GBP')}>
                                  <DropdownMenuRadioItem value="EUR">€ EUR</DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="USD">$ USD</DropdownMenuRadioItem>
                                  <DropdownMenuRadioItem value="GBP">£ GBP</DropdownMenuRadioItem>
                              </DropdownMenuRadioGroup>
                          </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('settings.apiKey')}</DropdownMenuLabel>
                 <DropdownMenuGroup>
                    <div className="px-2 py-1.5 text-sm">
                        <div className="flex items-center gap-2">
                             <Input 
                                type="password" 
                                placeholder={t('settings.apiKeyPlaceholder')}
                                value={apiKey} 
                                onChange={(e) => setApiKey(e.target.value)} 
                                className="h-8"
                            />
                            <Button size="sm" onClick={handleApiKeySave} disabled={apiKey === geminiApiKey}>{t('common.save')}</Button>
                        </div>
                    </div>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
