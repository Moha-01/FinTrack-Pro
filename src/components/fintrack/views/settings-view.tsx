
"use client";

import React, { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/use-settings';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { RefreshCw } from 'lucide-react';
import { useTheme } from "next-themes"

interface SettingsViewProps {
    onResetApp: () => void;
}

export function SettingsView({ onResetApp }: SettingsViewProps) {
    const { language, setLanguage, currency, setCurrency, geminiApiKey, setGeminiApiKey, t } = useSettings();
    const { theme, setTheme } = useTheme();
    const [localApiKey, setLocalApiKey] = useState(geminiApiKey || '');

    useEffect(() => {
        setLocalApiKey(geminiApiKey || '');
    }, [geminiApiKey]);

    const handleApiKeySave = () => {
        setGeminiApiKey(localApiKey);
    };

    return (
        <>
        <div className="flex flex-col gap-2">
            <h1 className="text-lg font-semibold md:text-2xl">{t('settings.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('settings.description')}</p>
        </div>
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label>{t('settings.toggleTheme')}</Label>
                        <div className="flex items-center gap-2 rounded-lg border p-1">
                            <Button variant={theme === 'light' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('light')}>{t('settings.light')}</Button>
                            <Button variant={theme === 'dark' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('dark')}>{t('settings.dark')}</Button>
                            <Button variant={theme === 'system' ? 'secondary' : 'ghost'} size="sm" onClick={() => setTheme('system')}>{t('settings.system')}</Button>
                        </div>
                    </div>
                     <div className="flex items-center justify-between">
                        <Label>{t('settings.language')}</Label>
                        <Select value={language} onValueChange={(val) => setLanguage(val as 'en' | 'de' | 'ar')}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Language" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="ar">العربية</SelectItem>
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('settings.apiKey')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                     <Label htmlFor="api-key-input">{t('settings.apiKey')}</Label>
                     <div className="flex items-center gap-2">
                        <Input 
                            id="api-key-input"
                            type="text" 
                            placeholder={t('settings.apiKeyPlaceholder')}
                            value={localApiKey} 
                            onChange={(e) => setLocalApiKey(e.target.value)}
                        />
                        <Button onClick={handleApiKeySave} disabled={localApiKey === geminiApiKey}>{t('common.save')}</Button>
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">{t('settings.apiKeyNote')}</p>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle className="text-destructive">{t('settings.resetApp')}</CardTitle>
                    <CardDescription>{t('settings.resetAppDescription')}</CardDescription>
                </CardHeader>
                <CardFooter className="border-t pt-4">
                     <AlertDialog>
                       <AlertDialogTrigger asChild>
                           <Button variant="destructive">
                             <RefreshCw className="mr-2 h-4 w-4" />
                             {t('settings.resetApp')}
                           </Button>
                       </AlertDialogTrigger>
                       <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>{t('settings.resetAppTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('settings.resetAppDescription')}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                              <AlertDialogAction onClick={onResetApp} className="bg-destructive hover:bg-destructive/90">{t('settings.resetAppConfirm')}</AlertDialogAction>
                          </AlertDialogFooter>
                       </AlertDialogContent>
                     </AlertDialog>
                </CardFooter>
            </Card>
        </div>
        </>
    );
}
