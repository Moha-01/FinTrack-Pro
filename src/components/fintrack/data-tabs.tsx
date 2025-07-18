

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format, parseISO } from "date-fns";
import { de } from "date-fns/locale";
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


const incomeSchema = z.object({
  source: z.string().min(2, "Quelle muss mindestens 2 Zeichen lang sein."),
  amount: z.coerce.number().positive("Betrag muss positiv sein."),
  recurrence: z.enum(["monthly", "yearly"]),
});

const expenseSchema = z.object({
  category: z.string().min(2, "Kategorie muss mindestens 2 Zeichen lang sein."),
  amount: z.coerce.number().positive("Betrag muss positiv sein."),
  recurrence: z.enum(["monthly", "yearly"]),
});

const paymentSchema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein."),
  amount: z.coerce.number().positive("Betrag muss positiv sein."),
  startDate: z.date({ required_error: "Ein Startdatum ist erforderlich." }),
  numberOfPayments: z.coerce.number().int().positive("Muss eine positive Anzahl von Zahlungen sein."),
});

const oneTimePaymentSchema = z.object({
    name: z.string().min(2, "Name muss mindestens 2 Zeichen lang sein."),
    amount: z.coerce.number().positive("Betrag muss positiv sein."),
    dueDate: z.date({ required_error: "Ein Fälligkeitsdatum ist erforderlich." }),
});

const formatCurrency = (amount: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount);

interface DataTabsProps {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  onAdd: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', data: any) => void;
  onDelete: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', id: string) => void;
}

export function DataTabs({ income, expenses, payments, oneTimePayments, onAdd, onDelete }: DataTabsProps) {
  const incomeForm = useForm<z.infer<typeof incomeSchema>>({ resolver: zodResolver(incomeSchema), defaultValues: { source: "", amount: 0, recurrence: "monthly" }});
  const expenseForm = useForm<z.infer<typeof expenseSchema>>({ resolver: zodResolver(expenseSchema), defaultValues: { category: "", amount: 0, recurrence: "monthly" }});
  const paymentForm = useForm<z.infer<typeof paymentSchema>>({ resolver: zodResolver(paymentSchema), defaultValues: { name: "", amount: 0, numberOfPayments: 12 }});
  const oneTimePaymentForm = useForm<z.infer<typeof oneTimePaymentSchema>>({ resolver: zodResolver(oneTimePaymentSchema), defaultValues: { name: "", amount: 0 }});
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Datenmanager</CardTitle>
        <CardDescription>Fügen Sie Ihre Finanzdaten hinzu, sehen Sie sie ein und verwalten Sie sie.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="sm:inline-flex">
              <TabsTrigger value="income"><DollarSign className="w-4 h-4 mr-2"/>Einkommen</TabsTrigger>
              <TabsTrigger value="expenses"><CreditCard className="w-4 h-4 mr-2"/>Ausgaben</TabsTrigger>
              <TabsTrigger value="payments"><CalendarClock className="w-4 h-4 mr-2"/>Ratenzahlung</TabsTrigger>
              <TabsTrigger value="oneTime"><AlertCircle className="w-4 h-4 mr-2"/>Einmalig</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="income">
            <Form {...incomeForm}>
              <form onSubmit={incomeForm.handleSubmit(data => { onAdd('income', data); incomeForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="source" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>Quelle</FormLabel><FormControl><Input placeholder="z.B. Gehalt" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="amount" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>Betrag</FormLabel><FormControl><Input type="number" placeholder="z.B. 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 </div>
                 <FormField name="recurrence" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>Häufigkeit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Häufigkeit auswählen" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monatlich</SelectItem><SelectItem value="yearly">Jährlich</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">Einkommen hinzufügen</Button>
              </form>
            </Form>
            <DataTable data={income} onDelete={(id) => onDelete('income', id)} type="income" />
          </TabsContent>
          
          <TabsContent value="expenses">
            <Form {...expenseForm}>
              <form onSubmit={expenseForm.handleSubmit(data => { onAdd('expense', data); expenseForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField name="category" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>Kategorie</FormLabel><FormControl><Input placeholder="z.B. Lebensmittel" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <FormField name="amount" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>Betrag</FormLabel><FormControl><Input type="number" placeholder="z.B. 400" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="recurrence" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>Häufigkeit</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Häufigkeit auswählen" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monatlich</SelectItem><SelectItem value="yearly">Jährlich</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">Ausgabe hinzufügen</Button>
              </form>
            </Form>
            <DataTable data={expenses} onDelete={(id) => onDelete('expense', id)} type="expense" />
          </TabsContent>

          <TabsContent value="payments">
             <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(data => { onAdd('payment', data); paymentForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                <FormField name="name" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="z.B. Autokredit" {...field} /></FormControl><FormMessage /></FormItem>)} />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="amount" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>Monatlicher Betrag</FormLabel><FormControl><Input type="number" placeholder="z.B. 350" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="numberOfPayments" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>Anzahl Raten</FormLabel><FormControl><Input type="number" placeholder="z.B. 48" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="startDate" control={paymentForm.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Startdatum</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: de })) : (<span>Datum auswählen</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">Zahlung hinzufügen</Button>
              </form>
            </Form>
            <DataTable data={payments} onDelete={(id) => onDelete('payment', id)} type="payment" />
          </TabsContent>
          
          <TabsContent value="oneTime">
             <Form {...oneTimePaymentForm}>
              <form onSubmit={oneTimePaymentForm.handleSubmit(data => { onAdd('oneTimePayment', data); oneTimePaymentForm.reset(); })} className="space-y-4 p-4 border rounded-lg mb-4">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField name="name" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="z.B. Klarna" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField name="amount" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>Betrag</FormLabel><FormControl><Input type="number" placeholder="z.B. 250" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormField name="dueDate" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Fälligkeitsdatum</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>{field.value ? (format(field.value, "PPP", { locale: de })) : (<span>Datum auswählen</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)} />
                <Button type="submit" className="w-full">Einmalige Zahlung hinzufügen</Button>
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
  if(data.length === 0) return <p className="text-center text-muted-foreground p-4">Noch keine Daten vorhanden.</p>;

  const headers = 
      type === 'income' ? ['Quelle', 'Betrag', 'Häufigkeit'] 
    : type === 'expense' ? ['Kategorie', 'Betrag', 'Häufigkeit'] 
    : type === 'payment' ? ['Name', 'Monatl. Betrag', 'Anz. Raten', 'Startdatum', 'Enddatum']
    : ['Name', 'Betrag', 'Fälligkeitsdatum'];
  
  const recurrenceMap = {
    monthly: 'Monatlich',
    yearly: 'Jährlich',
  }

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, "PPP", { locale: de });
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <ScrollArea className="max-w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
              <TableHead className="text-right">Aktionen</TableHead>
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
