"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { de, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CalendarIcon, DollarSign, CreditCard, ShoppingCart } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import type { Transaction } from "@/types/fintrack";
import { TransactionSchema, InstallmentDetailsSchema } from "@/types/fintrack.zod";


const getValidationSchema = (t: Function) => {
    return TransactionSchema.omit({id: true, date: true}).extend({
        date: z.date({ required_error: t('validation.date') }),
        name: z.string().min(2, t('validation.name')),
        amount: z.coerce.number().positive(t('validation.amount')),
        installmentDetails: InstallmentDetailsSchema.omit({completionDate: true}).extend({
            numberOfPayments: z.coerce.number().int().positive(t('validation.numberOfPayments')),
        }).optional(),
    });
};

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAdd: (data: Omit<Transaction, 'id'>) => void;
  onUpdate: (data: Transaction) => void;
  transactionToEdit: Transaction | null;
}

type FormValues = z.infer<ReturnType<typeof getValidationSchema>>;


export function AddTransactionDialog({ isOpen, onOpenChange, onAdd, onUpdate, transactionToEdit }: AddTransactionDialogProps) {
  const { t, language } = useSettings();
  const locale = language === 'de' ? de : enUS;
  const isEditMode = transactionToEdit !== null;

  const validationSchema = getValidationSchema(t);

  const form = useForm<FormValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: {
      category: 'expense',
      recurrence: 'once',
      name: '',
      amount: '' as any,
      date: new Date(),
      status: 'pending',
      installmentDetails: undefined,
    },
  });
  
  const selectedCategory = form.watch("category");

  useEffect(() => {
    if (selectedCategory === 'payment') {
      form.setValue('recurrence', 'monthly');
    }
  }, [selectedCategory, form]);

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && transactionToEdit) {
        form.reset({
          ...transactionToEdit,
          amount: transactionToEdit.amount,
          date: parseISO(transactionToEdit.date),
          installmentDetails: transactionToEdit.installmentDetails ? {
              numberOfPayments: transactionToEdit.installmentDetails.numberOfPayments,
          } : undefined,
        });
      } else {
        form.reset({
          category: 'expense',
          recurrence: 'once',
          name: '',
          amount: '' as any,
          date: new Date(),
          status: 'pending',
          installmentDetails: undefined
        });
      }
    }
  }, [isOpen, isEditMode, transactionToEdit, form]);


  const onSubmit = (values: z.infer<typeof validationSchema>) => {
    const dataToSave = {
        ...values,
        date: format(values.date, 'yyyy-MM-dd'),
    } as Omit<Transaction, 'id'>;

    if (isEditMode) {
      onUpdate({ ...dataToSave, id: transactionToEdit.id });
    } else {
      onAdd(dataToSave);
    }
    handleClose();
  };

  const handleClose = () => {
    onOpenChange(false);
  };
  
  
  const typeOptions = [
    { value: 'income', label: t('common.income'), icon: <DollarSign className="w-4 h-4" /> },
    { value: 'expense', label: t('common.expense'), icon: <ShoppingCart className="w-4 h-4" /> },
    { value: 'payment', label: t('common.recurringPayment'), icon: <CreditCard className="w-4 h-4" /> },
  ];
  
  const dialogTitle = isEditMode ? t('dataTabs.editTransaction') : t('dataTabs.addTransaction');
  const dialogDescription = isEditMode ? t('dataTabs.editDescription') : t('dataTabs.selectType');


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
             <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dataTabs.category')}</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEditMode}>
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder={t('dataTabs.selectType')} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {typeOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                                <div className="flex items-center gap-2">
                                    {opt.icon}
                                    <span>{opt.label}</span>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dataTabs.name')}</FormLabel>
                  <FormControl>
                    <Input placeholder={
                        selectedCategory === 'payment' ? t('dataTabs.namePlaceholderPayment') :
                        selectedCategory === 'expense' ? t('dataTabs.categoryPlaceholder') :
                        t('dataTabs.sourcePlaceholder')
                    } {...field} />
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
                  <FormLabel>{selectedCategory === 'payment' ? t('dataTabs.installmentAmount') : t('dataTabs.amount')}</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recurrence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('dataTabs.recurrence')}</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={selectedCategory === 'payment'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('dataTabs.recurrencePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="once">{selectedCategory === 'income' ? t('common.oneTimeIncome') : t('common.oneTimePayment')}</SelectItem>
                      <SelectItem value="monthly">{t('dataTabs.monthly')}</SelectItem>
                      <SelectItem value="yearly">{t('dataTabs.yearly')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>{selectedCategory === 'payment' ? t('dataTabs.startDate') : t('dataTabs.date')}</FormLabel>
                    <Popover>
                    <PopoverTrigger asChild>
                        <FormControl>
                        <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                            {field.value ? (format(field.value, "PPP", { locale: locale })) : (<span>{t('dataTabs.selectDate')}</span>)}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                        </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                    </Popover>
                    <FormMessage />
                </FormItem>
                )}
            />
            
            {selectedCategory === 'payment' && (
                 <FormField
                    control={form.control}
                    name="installmentDetails.numberOfPayments"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('dataTabs.numberOfInstallments')}</FormLabel>
                        <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10))} />
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
