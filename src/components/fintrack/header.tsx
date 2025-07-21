
"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, Wallet, User, PlusCircle, Trash2, Languages, Landmark, Settings, KeyRound, Pencil, Printer, RefreshCw, PanelLeft } from 'lucide-react';
import type { FC } from "react";
import React, { useState } from 'react';
import { ModeToggle } from "@/components/mode-toggle";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SidebarNav } from './sidebar';
import type { FintrackView } from '@/types/fintrack';


interface DashboardHeaderProps {
  onImportClick: () => void;
  onExport: () => void;
  onPrintReport: () => void;
  isPrinting: boolean;
  profiles: string[];
  activeProfile: string;
  onProfileChange: (profileName: string) => void;
  onAddProfile: (profileName: string) => void;
  onDeleteProfile: (profileName: string) => void;
  onRenameProfile: () => void;
  setActiveView: (view: FintrackView) => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ 
  onImportClick, 
  onExport,
  onPrintReport,
  isPrinting,
  profiles,
  activeProfile,
  onProfileChange,
  onAddProfile,
  onDeleteProfile,
  onRenameProfile,
  setActiveView,
}) => {
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
       <div className="lg:hidden">
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0">
                    <PanelLeft className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
                <SidebarNav setActiveView={setActiveView} isMobile={true} />
            </SheetContent>
        </Sheet>
       </div>
      <div className="w-full flex-1">
        {/* Can be used for search or breadcrumbs later */}
      </div>
      <ProfileManager 
        profiles={profiles}
        activeProfile={activeProfile}
        onProfileChange={onProfileChange}
        onAddProfile={onAddProfile}
        onDeleteProfile={onDeleteProfile}
        onImportClick={onImportClick}
        onExport={onExport}
        onRenameProfile={onRenameProfile}
        onPrintReport={onPrintReport}
        isPrinting={isPrinting}
      />
    </header>
  );
};

interface ProfileManagerProps {
  profiles: string[];
  activeProfile: string;
  onProfileChange: (profileName: string) => void;
  onAddProfile: (profileName: string) => void;
  onDeleteProfile: (profileName: string) => void;
  onRenameProfile: () => void;
  onImportClick: () => void;
  onExport: () => void;
  onPrintReport: () => void;
  isPrinting: boolean;
}

const ProfileManager: FC<ProfileManagerProps> = ({ profiles, activeProfile, onProfileChange, onAddProfile, onDeleteProfile, onRenameProfile, onImportClick, onExport, onPrintReport, isPrinting }) => {
  const [newProfileName, setNewProfileName] = useState("");
  const { t } = useSettings();

  const handleAddClick = () => {
    onAddProfile(newProfileName);
    setNewProfileName("");
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="rounded-full">
          <User className="h-5 w-5" />
          <span className="sr-only">{t('profileManager.toggleMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t('profileManager.activeProfile')}: <span className="font-semibold">{activeProfile}</span></DropdownMenuLabel>
        <DropdownMenuSeparator />
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
          <DropdownMenuItem onSelect={onRenameProfile}>
              <Pencil className="mr-2 h-4 w-4" />
              <span>{t('profileManager.renameProfile')}</span>
          </DropdownMenuItem>
           <AlertDialog>
             <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={profiles.length <= 1}>
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
            <DropdownMenuItem onSelect={onPrintReport} disabled={isPrinting}>
                <Printer className="mr-2 h-4 w-4" />
                <span>{t('header.printReport')}</span>
            </DropdownMenuItem>
         </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
