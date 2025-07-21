
"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSettings } from "@/hooks/use-settings";
import type { SavingsAccount, SavingsGoal } from "@/types/fintrack";

interface AddGoalDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddGoal: (name: string, targetAmount: number, currentAmount: number, linkedAccountId?: string) => void;
  onUpdateGoal: (goal: SavingsGoal) => void;
  goalToEdit: SavingsGoal | null;
  accounts: SavingsAccount[];
}

export function AddGoalDialog({ isOpen, onOpenChange, onAddGoal, onUpdateGoal, goalToEdit, accounts }: AddGoalDialogProps) {
  const { t } = useSettings();
  const isEditMode = goalToEdit !== null;

  const formSchema = z.object({
    name: z.string().min(2, t('validation.goalName')),
    targetAmount: z.coerce.number().positive(t('validation.targetAmount')),
    currentAmount: z.coerce.number().nonnegative().optional(),
    linkedAccountId: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      targetAmount: '' as any,
      currentAmount: 0,
      linkedAccountId: undefined,
    },
  });

  useEffect(() => {
    if (isEditMode) {
      form.reset({
        name: goalToEdit.name,
        targetAmount: goalToEdit.targetAmount,
        currentAmount: goalToEdit.currentAmount,
        linkedAccountId: goalToEdit.linkedAccountId || undefined,
      });
    } else {
      form.reset({
        name: "",
        targetAmount: '' as any,
        currentAmount: 0,
        linkedAccountId: undefined,
      });
    }
  }, [goalToEdit, form, isEditMode]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditMode) {
      onUpdateGoal({
        ...goalToEdit,
        ...values,
        currentAmount: values.currentAmount || 0,
      });
    } else {
      onAddGoal(values.name, values.targetAmount, values.currentAmount || 0, values.linkedAccountId);
    }
    handleClose();
  };

  const handleClose = () => {
    form.reset();
    onOpenChange(false);
  }

  const linkedAccountId = form.watch("linkedAccountId");

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? t('savingsGoals.editGoalTitle') : t('savingsGoals.addGoalTitle')}</DialogTitle>
          <DialogDescription>{isEditMode ? t('savingsGoals.editGoalDescription') : t('savingsGoals.addGoalDescription')}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('savingsGoals.goalName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('savingsGoals.goalNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('savingsGoals.targetAmount')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="linkedAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('savingsGoals.linkToAccount')}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('savingsGoals.linkToAccountPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">{t('savingsGoals.dontLink')}</SelectItem>
                      <SelectItem value="main_balance">{t('summary.currentBalance')}</SelectItem>
                      {accounts.map(account => (
                        <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('savingsGoals.currentAmount')}</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} disabled={!!linkedAccountId && linkedAccountId !== 'none'} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
