
"use client";

import React from 'react';
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
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type {
  Income,
  Expense,
  RecurringPayment,
  OneTimePayment,
  AnyTransaction,
  TransactionType,
} from '@/types/fintrack';
import { format, parseISO } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface DataManagerProps {
  income: Income[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  onAddClick: () => void;
  onEditClick: (transaction: AnyTransaction) => void;
  onDelete: (type: TransactionType, id: string) => void;
}

export function DataManager({
  income,
  expenses,
  payments,
  oneTimePayments,
  onAddClick,
  onEditClick,
  onDelete,
}: DataManagerProps) {
  const { t } = useSettings();
  
  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('dataTabs.title')}</CardTitle>
            <CardDescription>{t('dataTabs.description')}</CardDescription>
          </div>
           <Button onClick={onAddClick} size="sm">
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
              onEdit={onEditClick}
              onDelete={onDelete}
            />
            <DataTable
              type="expense"
              data={expenses}
              onEdit={onEditClick}
              onDelete={onDelete}
            />
            <DataTable
              type="payment"
              data={payments}
              onEdit={onEditClick}
              onDelete={onDelete}
            />
            <DataTable
              type="oneTimePayment"
              data={oneTimePayments}
              onEdit={onEditClick}
              onDelete={onDelete}
            />
          </Tabs>
        </CardContent>
      </Card>
    </>
  );
}

// Define a mapping from transaction type string to the actual data type
type DataTypeMap = {
  income: Income;
  expense: Expense;
  payment: RecurringPayment;
  oneTimePayment: OneTimePayment;
};

interface DataTableProps<T extends TransactionType> {
  type: T;
  data: DataTypeMap[T][];
  onEdit: (transaction: AnyTransaction) => void;
  onDelete: (type: T, id: string) => void;
}

function DataTable<T extends TransactionType>({ type, data, onEdit, onDelete }: DataTableProps<T>) {
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

  const renderCell = (item: DataTypeMap[T], field: keyof DataTypeMap[T] | string) => {
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
        if (field === 'amount') return formatCurrency(paymentItem.amount);
        if (field === 'startDate') return formatDate(paymentItem.startDate);
        if (field === 'completionDate') return formatDate(paymentItem.completionDate);
        if (field === 'numberOfPayments') return paymentItem.numberOfPayments;
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
      payment: ['name', 'amount', 'startDate', 'completionDate', 'numberOfPayments'],
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
                  {fieldsMap[type].map((field: any) => (
                      <TableCell key={field}>{renderCell(item, field)}</TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit({...item, type})} className="text-muted-foreground hover:text-primary transition-colors">
                      <Pencil className="h-4 w-4" />
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
