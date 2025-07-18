"use client";

import { Button } from "@/components/ui/button";
import { Download, Upload, Wallet } from 'lucide-react';
import type { FC } from "react";
import { ModeToggle } from "../mode-toggle";

interface DashboardHeaderProps {
  onImportClick: () => void;
  onExport: () => void;
}

export const DashboardHeader: FC<DashboardHeaderProps> = ({ onImportClick, onExport }) => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="flex items-center gap-2">
        <Wallet className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">FinTrack Pro</h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <ModeToggle />
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
