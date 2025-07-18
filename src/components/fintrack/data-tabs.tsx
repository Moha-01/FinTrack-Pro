"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, DollarSign, CreditCard, CalendarClock, AlertCircle } from "lucide-react";
import type { Income, Expense, RecurringPayment, OneTimePayment } from "@/types/fintrack";
import React from "react";

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
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
  numberOfPayments: z.coerce.number().int().positive("Must be a positive number of payments."),
});

const oneTimePaymentSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    amount: z.coerce.number().positive("Amount must be positive."),
    dueDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

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
  const paymentForm = useForm<z.infer<typeof paymentSchema>>({ resolver: zodResolver(paymentSchema), defaultValues: { name: "", amount: 0, startDate: "", numberOfPayments: 12 }});
  const oneTimePaymentForm = useForm<z.infer<typeof oneTimePaymentSchema>>({ resolver: zodResolver(oneTimePaymentSchema), defaultValues: { name: "", amount: 0, dueDate: "" }});
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Data Manager</CardTitle>
        <CardDescription>Add, view, and manage your financial data.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="income">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="income"><DollarSign className="w-4 h-4 mr-2"/>Income</TabsTrigger>
            <TabsTrigger value="expenses"><CreditCard className="w-4 h-4 mr-2"/>Expenses</TabsTrigger>
            <TabsTrigger value="payments"><CalendarClock className="w-4 h-4 mr-2"/>Recurring</TabsTrigger>
            <TabsTrigger value="oneTime"><AlertCircle className="w-4 h-4 mr-2"/>One-Time</TabsTrigger>
          </TabsList>

          <TabsContent value="income">
            <Form {...incomeForm}>
              <form onSubmit={incomeForm.handleSubmit(data => { onAdd('income', data); incomeForm.reset(); })} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg mb-4">
                <FormField name="source" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>Source</FormLabel><FormControl><Input placeholder="e.g. Salary" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="amount" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g. 5000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="recurrence" control={incomeForm.control} render={({ field }) => (<FormItem><FormLabel>Recurrence</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select recurrence" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" className="self-end">Add Income</Button>
              </form>
            </Form>
            <DataTable data={income} onDelete={(id) => onDelete('income', id)} type="income" />
          </TabsContent>
          
          <TabsContent value="expenses">
            <Form {...expenseForm}>
              <form onSubmit={expenseForm.handleSubmit(data => { onAdd('expense', data); expenseForm.reset(); })} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg mb-4">
                <FormField name="category" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>Category</FormLabel><FormControl><Input placeholder="e.g. Groceries" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="amount" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g. 400" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="recurrence" control={expenseForm.control} render={({ field }) => (<FormItem><FormLabel>Recurrence</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select recurrence" /></SelectTrigger></FormControl><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
                <Button type="submit" className="self-end">Add Expense</Button>
              </form>
            </Form>
            <DataTable data={expenses} onDelete={(id) => onDelete('expense', id)} type="expense" />
          </TabsContent>

          <TabsContent value="payments">
             <Form {...paymentForm}>
              <form onSubmit={paymentForm.handleSubmit(data => { onAdd('payment', data); paymentForm.reset(); })} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-lg mb-4">
                <FormField name="name" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Car Loan" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="amount" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>Monthly Amount</FormLabel><FormControl><Input type="number" placeholder="e.g. 350" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="startDate" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel>Start Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="numberOfPayments" control={paymentForm.control} render={({ field }) => (<FormItem><FormLabel># of Payments</FormLabel><FormControl><Input type="number" placeholder="e.g. 48" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="self-end">Add Payment</Button>
              </form>
            </Form>
            <DataTable data={payments} onDelete={(id) => onDelete('payment', id)} type="payment" />
          </TabsContent>
          
          <TabsContent value="oneTime">
             <Form {...oneTimePaymentForm}>
              <form onSubmit={oneTimePaymentForm.handleSubmit(data => { onAdd('oneTimePayment', data); oneTimePaymentForm.reset(); })} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg mb-4">
                <FormField name="name" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="e.g. Klarna" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="amount" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>Amount</FormLabel><FormControl><Input type="number" placeholder="e.g. 250" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField name="dueDate" control={oneTimePaymentForm.control} render={({ field }) => (<FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" className="self-end">Add One-Time</Button>
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
  if(data.length === 0) return <p className="text-center text-muted-foreground p-4">No data yet.</p>;

  const headers = 
      type === 'income' ? ['Source', 'Amount', 'Recurrence'] 
    : type === 'expense' ? ['Category', 'Amount', 'Recurrence'] 
    : type === 'payment' ? ['Name', 'Monthly Amount', '# Payments', 'Start Date', 'End Date']
    : ['Name', 'Amount', 'Due Date'];

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(h => <TableHead key={h}>{h}</TableHead>)}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(item => (
            <TableRow key={item.id}>
                {type === 'income' && <>
                    <TableCell>{item.source}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.recurrence}</TableCell>
                </>}
                {type === 'expense' && <>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.recurrence}</TableCell>
                </>}
                {type === 'payment' && <>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.numberOfPayments}</TableCell>
                    <TableCell>{item.startDate}</TableCell>
                    <TableCell>{item.completionDate}</TableCell>
                </>}
                 {type === 'oneTimePayment' && <>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{formatCurrency(item.amount)}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
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
    </div>
  );
}
