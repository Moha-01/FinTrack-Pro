
"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";

interface AddSavingsAccountDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddAccount: (name: string, amount: number, interestRate?: number) => void;
}

export function AddSavingsAccountDialog({ isOpen, onOpenChange, onAddAccount }: AddSavingsAccountDialogProps) {
  const { t } = useSettings();

  const formSchema = z.object({
    name: z.string().min(2, t('validation.name')),
    amount: z.coerce.number().positive(t('validation.amount')),
    interestRate: z.coerce.number().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      amount: undefined,
      interestRate: undefined,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddAccount(values.name, values.amount, values.interestRate);
    form.reset();
    onOpenChange(false);
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('savingsAccounts.addAccountTitle')}</DialogTitle>
          <DialogDescription>{t('savingsAccounts.addAccountDescription')}</DialogDescription>
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
             <FormField
              control={form.control}
              name="interestRate"
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
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>{t('common.cancel')}</Button>
              <Button type="submit">{t('common.add')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
