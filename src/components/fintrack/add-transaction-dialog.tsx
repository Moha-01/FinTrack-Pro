
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
import { CalendarIcon, DollarSign, CreditCard, CalendarClock, AlertCircle, TrendingUp } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import type { TransactionType, AnyTransaction } from "@/types/fintrack";
import {
  IncomeSchema,
  OneTimeIncomeSchema,
  ExpenseSchema,
  RecurringPaymentSchema,
  OneTimePaymentSchema,
} from "@/types/fintrack.zod";


const baseFormSchemas = {
    income: IncomeSchema.omit({id: true, type: true}),
    oneTimeIncome: OneTimeIncomeSchema.omit({id: true, type: true}),
    expense: ExpenseSchema.omit({id: true, type: true}),
    payment: RecurringPaymentSchema.omit({id: true, type: true, completionDate: true}),
    oneTimePayment: OneTimePaymentSchema.omit({id: true, type: true, status: true}),
};

const getValidationSchema = (type: TransactionType, t: Function) => {
    const baseSchema = baseFormSchemas[type];
    
    // The date from the popover is a Date object, but our zod schema expects a string.
    // We transform it before validation.
    const dateTransformer = z.union([z.string(), z.date()]).transform((val) => {
        if (val instanceof Date) return val.toISOString();
        return val;
    });

    const fieldSchemas = {
        source: z.string().min(2, t('validation.source')),
        category: z.string().min(2, t('validation.category')),
        name: z.string().min(2, t('validation.name')),
        amount: z.coerce.number().positive(t('validation.amount')),
        date: dateTransformer,
        numberOfPayments: z.coerce.number().int().positive(t('validation.numberOfPayments')),
    };

    let finalSchema = baseSchema;
    if ('source' in baseSchema.shape) finalSchema = finalSchema.extend({ source: fieldSchemas.source });
    if ('category' in baseSchema.shape) finalSchema = finalSchema.extend({ category: fieldSchemas.category });
    if ('name' in baseSchema.shape) finalSchema = finalSchema.extend({ name: fieldSchemas.name });
    if ('amount' in baseSchema.shape) finalSchema = finalSchema.extend({ amount: fieldSchemas.amount });
    if ('date' in baseSchema.shape) finalSchema = finalSchema.extend({ date: fieldSchemas.date });
    if ('numberOfPayments' in baseSchema.shape) finalSchema = finalSchema.extend({ numberOfPayments: fieldSchemas.numberOfPayments });

    return finalSchema;
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
      } else {
        setSelectedType('');
      }
    }
  }, [isOpen, isEditMode, transactionToEdit]);

  const handleClose = () => {
    onOpenChange(false);
  };

  const typeOptions = [
    { value: 'income', label: t('common.income'), icon: <DollarSign className="w-4 h-4" /> },
    { value: 'oneTimeIncome', label: t('common.oneTimeIncome'), icon: <TrendingUp className="w-4 h-4" /> },
    { value: 'expense', label: t('common.expense'), icon: <CreditCard className="w-4 h-4" /> },
    { value: 'payment', label: t('common.recurringPayment'), icon: <CalendarClock className="w-4 h-4" /> },
    { value: 'oneTimePayment', label: t('common.oneTimePayment'), icon: <AlertCircle className="w-4 h-4" /> },
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
          
          {selectedType && (
            <TransactionForm
              key={selectedType} 
              type={selectedType}
              isEditMode={isEditMode}
              transactionToEdit={transactionToEdit}
              onSave={(data) => {
                if(isEditMode) {
                    onUpdate(selectedType, { ...transactionToEdit, ...data });
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
function TransactionForm({ type, isEditMode, transactionToEdit, onSave, closeDialog }: { type: TransactionType, isEditMode: boolean, transactionToEdit: AnyTransaction | null, onSave: (data: any) => void, closeDialog: () => void }) {
  const { t, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const schema = getValidationSchema(type, t);
  
  const getDefaultValues = () => {
    if (isEditMode && transactionToEdit) {
      const values: any = { ...transactionToEdit };
      // The react-day-picker component expects a Date object, not an ISO string
      if (values.date) values.date = parseISO(values.date);
      return values;
    }
    // Return specific defaults for each type
    switch (type) {
      case 'income': return { source: "", amount: '' as any, recurrence: "monthly", date: new Date() };
      case 'oneTimeIncome': return { source: "", amount: '' as any, date: new Date() };
      case 'expense': return { category: "", amount: '' as any, recurrence: "monthly", date: new Date() };
      case 'payment': return { name: "", amount: '' as any, numberOfPayments: 12, date: new Date() };
      case 'oneTimePayment': return { name: "", amount: '' as any, date: new Date() };
      default: return {};
    }
  };

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: getDefaultValues()
  });

  useEffect(() => {
    form.reset(getDefaultValues());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionToEdit, type]);

  const onSubmit = (data: z.infer<typeof schema>) => {
    // The date needs to be formatted back into an ISO string for storage
    const dataToSave = { ...data, date: format(data.date, 'yyyy-MM-dd') };
    onSave(dataToSave);
    closeDialog();
  };

  const renderField = (fieldName: string) => {
    const labelMap: Record<string, string> = {
        date: type === 'oneTimePayment' ? t('dataTabs.dueDate') : (type === 'payment' ? t('dataTabs.startDate') : t('dataTabs.date')),
    };

    switch (fieldName) {
      case 'source': return <FormField name="source" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.source')}</FormLabel><FormControl><Input placeholder={t('dataTabs.sourcePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'category': return <FormField name="category" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.category')}</FormLabel><FormControl><Input placeholder={t('dataTabs.categoryPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'name': return <FormField name="name" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.name')}</FormLabel><FormControl><Input placeholder={type === 'payment' ? t('dataTabs.namePlaceholderPayment') : t('dataTabs.namePlaceholderOneTime')} {...field} /></FormControl><FormMessage /></FormItem>)} />;
      case 'amount': return <FormField name="amount" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.amount')}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />;
      case 'recurrence': return <FormField name="recurrence" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.recurrence')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('dataTabs.recurrencePlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">{t('dataTabs.monthly')}</SelectItem><SelectItem value="yearly">{t('dataTabs.yearly')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />;
      case 'date': return <FormField name="date" control={form.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>{labelMap[fieldName]}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: locale })) : (<span>{t('dataTabs.selectDate')}</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />;
      case 'numberOfPayments': return <FormField name="numberOfPayments" control={form.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.numberOfInstallments')}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />;
      default: return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(baseFormSchemas[type].shape).map((fieldName) => (
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
