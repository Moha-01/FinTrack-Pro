
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useSettings } from "@/hooks/use-settings";
import type { SavingsAccount, InterestRateEntry, InterestRecurrence } from "@/types/fintrack";
import { Separator } from "../ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";


interface AddSavingsAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddAccount: (name: string, amount: number, interestHistory: InterestRateEntry[]) => void;
  onUpdateAccount: (account: SavingsAccount) => void;
  accountToEdit: SavingsAccount | null;
}

export function AddSavingsAccountDialog({ isOpen, onOpenChange, onAddAccount, onUpdateAccount, accountToEdit }: AddSavingsAccountDialogProps) {
  const { t, language } = useSettings();
  const locale = language === 'de' ? de : enUS;
  const isEditMode = accountToEdit !== null;
  const [interestHistory, setInterestHistory] = useState<InterestRateEntry[]>([]);

  const formSchema = z.object({
    name: z.string().min(2, t('validation.name')),
    amount: z.coerce.number().positive(t('validation.amount')),
    // For new accounts only
    initialInterestRate: z.coerce.number().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: '' as any,
      initialInterestRate: '' as any,
    },
  });

  useEffect(() => {
    if (accountToEdit) {
      form.reset({ name: accountToEdit.name, amount: accountToEdit.amount });
       const migratedHistory = accountToEdit.interestHistory.map(h => ({
        ...h,
        recurrence: h.recurrence || 'yearly',
        payoutDay: h.payoutDay || 'last',
       }));
      setInterestHistory(migratedHistory.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()));
    } else {
      form.reset({ name: "", amount: '' as any, initialInterestRate: '' as any });
      setInterestHistory([]);
    }
  }, [accountToEdit, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditMode && accountToEdit) {
      onUpdateAccount({
        ...accountToEdit,
        name: values.name,
        amount: values.amount,
        interestHistory: interestHistory,
      });
    } else {
      const historyEntry = values.initialInterestRate ? [{
          rate: values.initialInterestRate,
          date: new Date().toISOString(),
          recurrence: 'yearly' as InterestRecurrence,
          payoutDay: 'last' as const
      }] : [];

      onAddAccount(
        values.name,
        values.amount,
        historyEntry
      );
    }
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  };
  
  const handleAddInterestEntry = () => {
    setInterestHistory(prev => [{ rate: 0, date: new Date().toISOString(), recurrence: 'yearly', payoutDay: 'last' }, ...prev]);
  };

  const handleInterestChange = (index: number, field: keyof InterestRateEntry, value: string | number) => {
    setInterestHistory(prev => {
        const newHistory = [...prev];
        const entry = { ...newHistory[index] };
        
        if (field === 'rate') {
            entry.rate = typeof value === 'number' ? value : parseFloat(value);
        } else if (field === 'recurrence') {
            entry.recurrence = value as InterestRecurrence;
        } else if (field === 'payoutDay') {
            entry.payoutDay = value === 'last' ? 'last' : Number(value);
        } else if (field === 'date') {
            entry.date = value as string;
        }

        newHistory[index] = entry;
        return newHistory.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    });
  };

  const handleDeleteInterestEntry = (index: number) => {
    setInterestHistory(prev => prev.filter((_, i) => i !== index));
  };


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('savingsAccounts.editAccountTitle') : t('savingsAccounts.addAccountTitle')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('savingsAccounts.editAccountDescription') : t('savingsAccounts.addAccountDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('savingsAccounts.accountName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('savingsAccounts.accountNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEditMode ? (
              <div className="space-y-4">
                <Separator />
                <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">{t('savingsAccounts.interestHistory')}</h4>
                    <Button type="button" size="sm" variant="outline" onClick={handleAddInterestEntry}>
                        <PlusCircle className="h-4 w-4 mr-2" />
                        {t('common.add')}
                    </Button>
                </div>
                <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                    {interestHistory.map((entry, index) => (
                        <div key={index} className="space-y-3 p-3 rounded-md border bg-muted/50">
                           <div className="flex justify-end">
                             <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteInterestEntry(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                             </Button>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <FormLabel>{t('savingsAccounts.interestRateShort')}</FormLabel>
                                    <Input 
                                        type="number" 
                                        step="0.01" 
                                        value={entry.rate} 
                                        onChange={(e) => handleInterestChange(index, 'rate', e.target.value)} 
                                    />
                                </div>
                                 <div>
                                    <FormLabel>{t('dataTabs.startDate')}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !entry.date && "text-muted-foreground")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {entry.date ? format(parseISO(entry.date), "PPP", { locale }) : <span>{t('dataTabs.selectDate')}</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={parseISO(entry.date)}
                                                onSelect={(d) => handleInterestChange(index, 'date', d?.toISOString() || '')}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <FormLabel>{t('savingsAccounts.interestRecurrence')}</FormLabel>
                                    <Select value={entry.recurrence} onValueChange={(v) => handleInterestChange(index, 'recurrence', v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="daily">{t('savingsAccounts.recurrence.daily')}</SelectItem>
                                            <SelectItem value="monthly">{t('savingsAccounts.recurrence.monthly')}</SelectItem>
                                            <SelectItem value="quarterly">{t('savingsAccounts.recurrence.quarterly')}</SelectItem>
                                            <SelectItem value="yearly">{t('savingsAccounts.recurrence.yearly')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <FormLabel>{t('savingsAccounts.payoutDay')}</FormLabel>
                                    <Select value={String(entry.payoutDay)} onValueChange={(v) => handleInterestChange(index, 'payoutDay', v)}>
                                        <SelectTrigger><SelectValue/></SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="last">{t('savingsAccounts.payout.lastDay')}</SelectItem>
                                             {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                                                <SelectItem key={day} value={String(day)}>{day}.</SelectItem>
                                             ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                           </div>
                        </div>
                    ))}
                </div>
              </div>
            ) : (
             <FormField
              control={form.control}
              name="initialInterestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('savingsAccounts.interestRate')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="2.0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
              <Button type="submit">{isEditMode ? t('common.save') : t('common.add')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
