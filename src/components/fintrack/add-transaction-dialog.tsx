
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
import { CalendarIcon, DollarSign, CreditCard, CalendarClock, AlertCircle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import type { TransactionType, AnyTransaction } from "@/types/fintrack";

const incomeSchema = z.object({
  source: z.string().min(2, "Source must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  recurrence: z.enum(["monthly", "yearly"]),
});

const expenseSchema = z.object({
  category: z.string().min(2, "Category must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  recurrence: z.enum(["monthly", "yearly"]),
});

const paymentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  startDate: z.date({ required_error: "A start date is required." }),
  numberOfPayments: z.coerce.number().int().positive("Must be a positive number of payments."),
});

const oneTimePaymentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  amount: z.coerce.number().positive("Amount must be positive."),
  dueDate: z.date({ required_error: "A due date is required." }),
});

const formSchemas = {
    income: incomeSchema,
    expense: expenseSchema,
    payment: paymentSchema,
    oneTimePayment: oneTimePaymentSchema,
};

interface AddTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAdd: (type: TransactionType, data: Omit<AnyTransaction, 'id' | 'type'>) => void;
  onUpdate: (type: TransactionType, data: AnyTransaction) => void;
  transactionToEdit: AnyTransaction | null;
}

export function AddTransactionDialog({ isOpen, onOpenChange, onAdd, onUpdate, transactionToEdit }: AddTransactionDialogProps) {
  const { t } = useSettings();
  const [selectedType, setSelectedType] = useState<TransactionType | ''>('');
  
  const isEditMode = transactionToEdit !== null;

  useEffect(() => {
    if (isOpen) {
      if (isEditMode) {
        setSelectedType(transactionToEdit.type);
      }
    } else {
      // Reset type when dialog closes, after a short delay to allow animations
      setTimeout(() => {
        setSelectedType('');
      }, 200);
    }
  }, [isOpen, isEditMode, transactionToEdit]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const typeOptions = [
    { value: 'income', label: t('common.income'), icon: <DollarSign className="w-4 h-4" /> },
    { value: 'expense', label: t('common.expense'), icon: <CreditCard className="w-4 h-4" /> },
    { value: 'payment', label: t('common.recurringPayment'), icon: <CalendarClock className="w-4 h-4" /> },
    { value: 'oneTimePayment', label: t('common.oneTimePayment'), icon: <AlertCircle className="w-4 h-4" /> },
  ];
  
  const currentSchema = selectedType ? formSchemas[selectedType] : null;
  const dialogTitle = isEditMode ? t('dataTabs.editTransaction') : t('dataTabs.addTransaction');
  const dialogDescription = isEditMode ? t('dataTabs.editDescription') : t('dataTabs.selectType');


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Select onValueChange={(value) => setSelectedType(value as TransactionType)} value={selectedType} disabled={isEditMode}>
            <SelectTrigger>
              <SelectValue placeholder={t('dataTabs.selectType')} />
            </SelectTrigger>
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
          
          {selectedType && currentSchema && (
            <TransactionForm
              key={selectedType} 
              schema={currentSchema}
              type={selectedType}
              isEditMode={isEditMode}
              transactionToEdit={transactionToEdit}
              onSave={(data: AnyTransaction) => {
                if(isEditMode) {
                    onUpdate(selectedType, { ...data, id: transactionToEdit.id });
                } else {
                    onAdd(selectedType, data);
                }
              }}
              closeDialog={handleClose}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Generic Form Component
function TransactionForm({ schema, type, isEditMode, transactionToEdit, onSave, closeDialog }: { schema: z.AnyZodObject, type: TransactionType, isEditMode: boolean, transactionToEdit: AnyTransaction | null, onSave: (data: any) => void, closeDialog: () => void }) {
  const { t, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const getValidationMessages = () => ({
      source: t('validation.source'),
      amount: t('validation.amount'),
      category: t('validation.category'),
      name: t('validation.name'),
      startDate: t('validation.startDate'),
      numberOfPayments: t('validation.numberOfPayments'),
      dueDate: t('validation.dueDate'),
  });

  const messages = getValidationMessages();
  const currentSchema = schema.extend(
    type === 'income' ? { source: z.string().min(2, messages.source), amount: z.coerce.number().positive(messages.amount) } :
    type === 'expense' ? { category: z.string().min(2, messages.category), amount: z.coerce.number().positive(messages.amount) } :
    type === 'payment' ? { name: z.string().min(2, messages.name), amount: z.coerce.number().positive(messages.amount), startDate: z.date({ required_error: messages.startDate }), numberOfPayments: z.coerce.number().int().positive(messages.numberOfPayments) } :
    { name: z.string().min(2, messages.name), amount: z.coerce.number().positive(messages.amount), dueDate: z.date({ required_error: messages.dueDate }) }
  );
  
  const getDefaultValues = () => {
    if (isEditMode && transactionToEdit) {
      const values: any = { ...transactionToEdit };
      if (values.startDate) values.startDate = parseISO(values.startDate);
      if (values.dueDate) values.dueDate = parseISO(values.dueDate);
      return values;
    }
    // Return specific defaults for each type
    switch (type) {
      case 'income':
        return { source: "", amount: '', recurrence: "monthly" };
      case 'expense':
        return { category: "", amount: '', recurrence: "monthly" };
      case 'payment':
        return { name: "", amount: '', numberOfPayments: 12 };
      case 'oneTimePayment':
        return { name: "", amount: '' };
      default:
        return {};
    }
  };

  const form = useForm<z.infer<typeof currentSchema>>({
    resolver: zodResolver(currentSchema),
    defaultValues: getDefaultValues()
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionToEdit, type]);

  const onSubmit = (data: z.infer<typeof currentSchema>) => {
    onSave(data);
    closeDialog();
  };

  const renderField = (fieldName: string) => {
    switch (fieldName) {
      case 'source': return <FormField name="source" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.source')}</FormLabel><FormControl><Input placeholder={t('dataTabs.sourcePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'category': return <FormField name="category" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.category')}</FormLabel><FormControl><Input placeholder={t('dataTabs.categoryPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'name': return <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.name')}</FormLabel><FormControl><Input placeholder={type === 'payment' ? t('dataTabs.namePlaceholderPayment') : t('dataTabs.namePlaceholderOneTime')} {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'amount': return <FormField name="amount" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.amount')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'recurrence': return <FormField name="recurrence" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.recurrence')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('dataTabs.recurrencePlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">{t('dataTabs.monthly')}</SelectItem><SelectItem value="yearly">{t('dataTabs.yearly')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />;
      case 'startDate': return <FormField name="startDate" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>{t('dataTabs.startDate')}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: locale })) : (<span>{t('dataTabs.selectDate')}</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange}  /></PopoverContent></Popover><FormMessage /></FormItem>)} />;
      case 'numberOfPayments': return <FormField name="numberOfPayments" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.numberOfInstallments')}</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'dueDate': return <FormField name="dueDate" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>{t('dataTabs.dueDate')}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: locale })) : (<span>{t('dataTabs.selectDate')}</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange}  /></PopoverContent></Popover><FormMessage /></FormItem>)} />;
      default: return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(schema.shape).map((fieldName) => (
          <React.Fragment key={fieldName}>
            {renderField(fieldName)}
          </React.Fragment>
        ))}
        <DialogFooter className="pt-4">
          <Button type="button" variant="outline" onClick={closeDialog}>{t('common.cancel')}</Button>
          <Button type="submit">{isEditMode ? t('common.save') : t('common.add')}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
