
"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, Wallet, User, PlusCircle, Trash2 } from 'lucide-react';
import type { FC } from "react";
import React, { useState } from 'react';
import { ModeToggle } from "../mode-toggle";
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
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold text-foreground sm:text-xl">FinTrack Pro</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
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
          Importieren
        </Button>
        <Button variant="outline" size="icon" onClick={onImportClick} className="transition-all hover:scale-105 sm:hidden">
            <Upload className="h-4 w-4" />
            <span className="sr-only">Importieren</span>
        </Button>
        <Button variant="outline" size="sm" onClick={onExport} className="transition-all hover:scale-105 hidden sm:inline-flex">
          <Download className="mr-2 h-4 w-4" />
          Exportieren
        </Button>
         <Button variant="outline" size="icon" onClick={onExport} className="transition-all hover:scale-105 sm:hidden">
            <Download className="h-4 w-4" />
            <span className="sr-only">Exportieren</span>
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
        <DropdownMenuLabel>Profile wechseln</DropdownMenuLabel>
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
                  <span>Profil hinzufügen</span>
                </DropdownMenuItem>
             </AlertDialogTrigger>
             <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Neues Profil erstellen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Geben Sie einen Namen für Ihr neues Profil ein.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input id="name" value={newProfileName} onChange={(e) => setNewProfileName(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddClick} disabled={!newProfileName}>Hinzufügen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
           <AlertDialog>
             <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={profiles.length <= 1 || activeProfile === 'Default'}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Aktives Profil löschen</span>
                </DropdownMenuItem>
             </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Diese Aktion kann nicht rückgängig gemacht werden. Dadurch wird das Profil '{activeProfile}' und alle zugehörigen Daten dauerhaft gelöscht.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteProfile(activeProfile)}>Löschen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
           </AlertDialog>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
