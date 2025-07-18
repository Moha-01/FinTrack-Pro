
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { de, enUS } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Trash2, DollarSign, CreditCard, CalendarClock, AlertCircle, CalendarIcon } from "lucide-react";
import type { Income, Expense, RecurringPayment, OneTimePayment } from "@/types/fintrack";
import React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useSettings } from "@/hooks/use-settings";

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


interface DataTabsProps {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  onAdd: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', data: any) => void;
  onDelete: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', id: string) => void;
}

export function DataTabs({ income, expenses, payments, oneTimePayments, onAdd, onDelete }: DataTabsProps) {
  const { t, language, formatCurrency } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const getValidationMessages = (schemaType: string) => {
    const messages = {
        source: t('validation.source'),
        amount: t('validation.amount'),
        category: t('validation.category'),
        name: t('validation.name'),
        startDate: t('validation.startDate'),
        numberOfPayments: t('validation.numberOfPayments'),
        dueDate: t('validation.dueDate')
    };
    if (schemaType === 'income') return { source: messages.source, amount: messages.amount };
    if (schemaType === 'expense') return { category: messages.category, amount: messages.amount };
    if (schemaType === 'payment') return { name: messages.name, amount: messages.amount, startDate: messages.startDate, numberOfPayments: messages.numberOfPayments };
    if (schemaType === 'oneTimePayment') return { name: messages.name, amount: messages.amount, dueDate: messages.dueDate };
    return {};
  }

  const currentIncomeSchema = incomeSchema.extend({
      source: z.string().min(2, getValidationMessages('income').source),
      amount: z.coerce.number().positive(getValidationMessages('income').amount)
  });
   const currentExpenseSchema = expenseSchema.extend({
      category: z.string().min(2, getValidationMessages('expense').category),
      amount: z.coerce.number().positive(getValidationMessages('expense').amount)
  });
  const currentPaymentSchema = paymentSchema.extend({
      name: z.string().min(2, getValidationMessages('payment').name),
      amount: z.coerce.number().positive(getValidationMessages('payment').amount),
      startDate: z.date({ required_error: getValidationMessages('payment').startDate }),
      numberOfPayments: z.coerce.number().int().positive(getValidationMessages('payment').numberOfPayments)
  });
  const currentOneTimePaymentSchema = oneTimePaymentSchema.extend({
      name: z.string().min(2, getValidationMessages('oneTimePayment').name),
      amount: z.coerce.number().positive(getValidationMessages('oneTimePayment').amount),
      dueDate: z.date({ required_error: getValidationMessages('oneTimePayment').dueDate })
  });
  
  const incomeForm = useForm<z.infer<typeof currentIncomeSchema>>({ resolver: zodResolver(currentIncomeSchema), defaultValues: { source: "", amount: 0, recurrence: "monthly" }});
  const expenseForm = useForm<z.infer<typeof currentExpenseSchema>>({ resolver: zodResolver(currentExpenseSchema), defaultValues: { category: "", amount: 0, recurrence: "monthly" }});
  const paymentForm = useForm<z.infer<typeof currentPaymentSchema>>({ resolver: zodResolver(currentPaymentSchema), defaultValues: { name: "", amount: 0, numberOfPayments: 12 }});
  const oneTimePaymentForm = useForm<z.infer<typeof currentOneTimePaymentSchema>>({ resolver: zodResolver(currentOneTimePaymentSchema), defaultValues: { name: "", amount: 0 }});
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('dataTabs.title')}</CardTitle>
        <CardDescription>{t('dataTabs.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="sm:inline-flex bg-muted/50">
              <TabsTrigger value="income"><DollarSign className="w-4 h-4 mr-2"/>{t('common.income')}</TabsTrigger>
              <TabsTrigger value="expenses"><CreditCard className="w-4 h-4 mr-2"/>{t('common.expenses')}</TabsTrigger>
              <TabsTrigger value="payments"><CalendarClock className="w-4 h-4 mr-2"/>{t('common.recurringPayment')}</TabsTrigger>
              <TabsTrigger value="oneTime"><AlertCircle className="w-4 h-4 mr-2"/>{t('common.oneTimePayment')}</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="income">
            <Form {...incomeForm}>
              <form onSubmit={incomeForm.handleSubmit(data => { onAdd('income', data); incomeForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="source" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.source')}</FormLabel><FormControl><Input placeholder={t('dataTabs.sourcePlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="amount" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.amount')}</FormLabel><FormControl><Input type="number" placeholder="z.B. 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </div>
                 <FormField name="recurrence" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.recurrence')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('dataTabs.recurrencePlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">{t('dataTabs.monthly')}</SelectItem><SelectItem value="yearly">{t('dataTabs.yearly')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">{t('dataTabs.addIncome')}</Button>
              </form>
            </Form>
            <DataTable data={income} onDelete={(id) => onDelete('income', id)} type="income" />
          </TabsContent>
          
          <TabsContent value="expenses">
            <Form {...expenseForm}>
              <form onSubmit={expenseForm.handleSubmit(data => { onAdd('expense', data); expenseForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField name="category" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.category')}</FormLabel><FormControl><Input placeholder={t('dataTabs.categoryPlaceholder')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="amount" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.amount')}</FormLabel><FormControl><Input type="number" placeholder="z.B. 400" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="recurrence" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.recurrence')}</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder={t('dataTabs.recurrencePlaceholder')} /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">{t('dataTabs.monthly')}</SelectItem><SelectItem value="yearly">{t('dataTabs.yearly')}</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">{t('dataTabs.addExpense')}</Button>
              </form>
            </Form>
            <DataTable data={expenses} onDelete={(id) => onDelete('expense', id)} type="expense" />
          </TabsContent>

          <TabsContent value="payments">
             <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(data => { onAdd('payment', data); paymentForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                <FormField name="name" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.name')}</FormLabel><FormControl><Input placeholder={t('dataTabs.namePlaceholderPayment')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="amount" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.monthlyAmount')}</FormLabel><FormControl><Input type="number" placeholder="z.B. 350" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="numberOfPayments" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.numberOfInstallments')}</FormLabel><FormControl><Input type="number" placeholder="z.B. 48" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="startDate" control={paymentForm.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>{t('dataTabs.startDate')}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: locale })) : (<span>{t('dataTabs.selectDate')}</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">{t('dataTabs.addPayment')}</Button>
              </form>
            </Form>
            <DataTable data={payments} onDelete={(id) => onDelete('payment', id)} type="payment" />
          </TabsContent>
          
          <TabsContent value="oneTime">
             <Form {...oneTimePaymentForm}>
              <form onSubmit={oneTimePaymentForm.handleSubmit(data => { onAdd('oneTimePayment', data); oneTimePaymentForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="name" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.name')}</FormLabel><FormControl><Input placeholder={t('dataTabs.namePlaceholderOneTime')} {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="amount" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>{t('dataTabs.amount')}</FormLabel><FormControl><Input type="number" placeholder="z.B. 250" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="dueDate" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>{t('dataTabs.dueDate')}</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: locale })) : (<span>{t('dataTabs.selectDate')}</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">{t('dataTabs.addOneTimePayment')}</Button>
              </form>
            </Form>
            <DataTable data={oneTimePayments} onDelete={(id) => onDelete('oneTimePayment', id)} type="oneTimePayment" />
          </TabsContent>

        </Tabs>
      </CardContent>
    </Card>
  );
}

function DataTable({ data, onDelete, type }: { data: any[], onDelete: (id: string) => void, type: 'income' | 'expense' | 'payment' | 'oneTimePayment' }) {
  const { t, formatCurrency, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  if(data.length === 0) return <p className="text-center text-muted-foreground p-4">{t('dataTabs.noData')}</p>;

  const headers = 
      type === 'income' ? [t('dataTabs.source'), t('dataTabs.amount'), t('dataTabs.recurrence')] 
    : type === 'expense' ? [t('dataTabs.category'), t('dataTabs.amount'), t('dataTabs.recurrence')] 
    : type === 'payment' ? [t('dataTabs.name'), t('dataTabs.monthlyAmount'), t('dataTabs.numberOfInstallments'), t('dataTabs.startDate'), t('dataTabs.endDate')]
    : [t('dataTabs.name'), t('dataTabs.amount'), t('dataTabs.dueDate')];
  
  const recurrenceMap = {
    monthly: t('dataTabs.monthly'),
    yearly: t('dataTabs.yearly'),
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, "PPP", { locale: locale });
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <ScrollArea className="max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(item => (
              <TableRow key={item.id}>
                  {type === 'income' && <>
                      <TableCell className="font-medium">{item.source}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{recurrenceMap[item.recurrence as keyof typeof recurrenceMap]}</TableCell>
                  </>}
                  {type === 'expense' && <>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{recurrenceMap[item.recurrence as keyof typeof recurrenceMap]}</TableCell>
                  </>}
                  {type === 'payment' && <>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell>{item.numberOfPayments}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.startDate)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.completionDate)}</TableCell>
                  </>}
                   {type === 'oneTimePayment' && <>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{formatCurrency(item.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(item.dueDate)}</TableCell>
                  </>}
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
