
"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type {
  Transaction,
  Income,
  Expense,
  RecurringPayment,
  OneTimePayment,
} from '@/types/fintrack';
import { format, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { AddTransactionDialog } from './add-transaction-dialog';

interface DataManagerProps {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  onAdd: (
    type: 'income' | 'expense' | 'payment' | 'oneTimePayment',
    data: any
  ) => void;
  onUpdate: (
    type: 'income' | 'expense' | 'payment' | 'oneTimePayment',
    data: any
  ) => void;
  onDelete: (
    type: 'income' | 'expense' | 'payment' | 'oneTimePayment',
    id: string
  ) => void;
}

export function DataManager({
  income,
  expenses,
  payments,
  oneTimePayments,
  onAdd,
  onUpdate,
  onDelete,
}: DataManagerProps) {
  const { t } = useSettings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const handleAddClick = () => {
    setEditingTransaction(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsDialogOpen(true);
  };
  
  return (
    <>
      <AddTransactionDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onAdd={onAdd}
        onUpdate={onUpdate}
        transactionToEdit={editingTransaction}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('dataTabs.title')}</CardTitle>
            <CardDescription>{t('dataTabs.description')}</CardDescription>
          </div>
           <Button onClick={handleAddClick} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dataTabs.addTransaction')}
            </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="income">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="income">{t('common.income')}</TabsTrigger>
              <TabsTrigger value="expenses">{t('common.expenses')}</TabsTrigger>
              <TabsTrigger value="payments">{t('common.recurringPayment')}</TabsTrigger>
              <TabsTrigger value="oneTimePayments">{t('common.oneTimePayment')}</TabsTrigger>
            </TabsList>
            <DataTable
              type="income"
              data={income}
              onEdit={handleEditClick}
              onDelete={onDelete}
            />
            <DataTable
              type="expense"
              data={expenses}
              onEdit={handleEditClick}
              onDelete={onDelete}
            />
            <DataTable
              type="payment"
              data={payments}
              onEdit={handleEditClick}
              onDelete={onDelete}
            />
            <DataTable
              type="oneTimePayment"
              data={oneTimePayments}
              onEdit={handleEditClick}
              onDelete={onDelete}
            />
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

interface DataTableProps<T extends Transaction> {
  type: T['type'];
  data: T[];
  onEdit: (transaction: T) => void;
  onDelete: (type: T['type'], id: string) => void;
}

function DataTable<T extends Transaction>({ type, data, onEdit, onDelete }: DataTableProps<T>) {
  const { t, formatCurrency, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const formatDate = (dateString: string) => format(parseISO(dateString), "P", { locale });

  const recurrenceMap = {
    monthly: t('dataTabs.monthly'),
    yearly: t('dataTabs.yearly'),
  };

  const tableHeaders = {
    income: [t('dataTabs.source'), t('common.amount'), t('dataTabs.recurrence')],
    expense: [t('dataTabs.category'), t('common.amount'), t('dataTabs.recurrence')],
    payment: [t('dataTabs.name'), t('dataTabs.monthlyAmount'), t('dataTabs.startDate'), t('dataTabs.endDate'), t('dataTabs.numberOfInstallments')],
    oneTimePayment: [t('dataTabs.name'), t('common.amount'), t('dataTabs.dueDate')],
  };

  const renderCell = (item: T, field: keyof T | string) => {
    switch (type) {
      case 'income': {
        const incomeItem = item as Income;
        if (field === 'source') return incomeItem.source;
        if (field === 'amount') return formatCurrency(incomeItem.amount);
        if (field === 'recurrence') return recurrenceMap[incomeItem.recurrence];
        break;
      }
      case 'expense': {
        const expenseItem = item as Expense;
        if (field === 'category') return expenseItem.category;
        if (field === 'amount') return formatCurrency(expenseItem.amount);
        if (field === 'recurrence') return recurrenceMap[expenseItem.recurrence];
        break;
      }
      case 'payment': {
        const paymentItem = item as RecurringPayment;
        if (field === 'name') return paymentItem.name;
        if (field === 'monthlyAmount') return formatCurrency(paymentItem.amount);
        if (field === 'startDate') return formatDate(paymentItem.startDate);
        if (field === 'endDate') return formatDate(paymentItem.completionDate);
        if (field === 'numberOfInstallments') return paymentItem.numberOfPayments;
        break;
      }
      case 'oneTimePayment': {
        const oneTimePaymentItem = item as OneTimePayment;
        if (field === 'name') return oneTimePaymentItem.name;
        if (field === 'amount') return formatCurrency(oneTimePaymentItem.amount);
        if (field === 'dueDate') return formatDate(oneTimePaymentItem.dueDate);
        break;
      }
    }
    return null;
  };
  
  const fieldsMap = {
      income: ['source', 'amount', 'recurrence'],
      expense: ['category', 'amount', 'recurrence'],
      payment: ['name', 'monthlyAmount', 'startDate', 'endDate', 'numberOfInstallments'],
      oneTimePayment: ['name', 'amount', 'dueDate']
  }

  return (
    <TabsContent value={type === 'payment' ? 'payments' : type === 'oneTimePayment' ? 'oneTimePayments' : type === 'expense' ? 'expenses' : 'income'}>
      <ScrollArea className="h-72">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders[type].map(header => (
                <TableHead key={header}>{header}</TableHead>
              ))}
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map(item => (
                <TableRow key={item.id}>
                  {fieldsMap[type].map((field) => (
                      <TableCell key={field}>{renderCell(item, field)}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(item)} className="text-muted-foreground hover:text-primary transition-colors">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(type, item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={tableHeaders[type].length + 1} className="h-24 text-center">
                  {t('dataTabs.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </TabsContent>
  );
}
