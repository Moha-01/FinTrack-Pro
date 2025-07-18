
"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, Trash2, Pencil, MoreHorizontal, ChevronDown } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';

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
  const [activeView, setActiveView] = useState<TransactionType>('income');

  const typeMap: Record<TransactionType, { label: string; data: any[] }> = {
    income: { label: t('common.income'), data: income },
    expense: { label: t('common.expenses'), data: expenses },
    payment: { label: t('common.recurringPayment'), data: payments },
    oneTimePayment: { label: t('common.oneTimePayment'), data: oneTimePayments },
  };
  
  return (
    <>
      <Card>
        <CardHeader className="flex-row items-start justify-between">
          <div>
            <CardTitle>{t('dataTabs.title')}</CardTitle>
            <CardDescription>{t('dataTabs.description')}</CardDescription>
          </div>
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {typeMap[activeView].label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={activeView} onValueChange={(v) => setActiveView(v as TransactionType)}>
                {Object.keys(typeMap).map((key) => (
                  <DropdownMenuRadioItem key={key} value={key}>
                    {typeMap[key as TransactionType].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
            {activeView === 'income' && <DataTable type="income" data={income} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'expense' && <DataTable type="expense" data={expenses} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'payment' && <DataTable type="payment" data={payments} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'oneTimePayment' && <DataTable type="oneTimePayment" data={oneTimePayments} onEdit={onEditClick} onDelete={onDelete} />}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
            <Button onClick={onAddClick} size="sm" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dataTabs.addTransaction')}
            </Button>
        </CardFooter>
      </Card>
    </>
  );
}

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

  const getHeadersAndFields = (transactionType: T) => {
    switch (transactionType) {
      case 'income':
        return {
          headers: [
            { label: t('dataTabs.source') },
            { label: t('common.amount') },
            { label: t('dataTabs.recurrence'), className: 'hidden md:table-cell' }
          ],
          fields: [
            { field: 'source' },
            { field: 'amount' },
            { field: 'recurrence', className: 'hidden md:table-cell' },
          ] as { field: keyof Income; className?: string }[]
        };
      case 'expense':
        return {
          headers: [
            { label: t('dataTabs.category') },
            { label: t('common.amount') },
            { label: t('dataTabs.recurrence'), className: 'hidden md:table-cell' }
          ],
          fields: [
            { field: 'category' },
            { field: 'amount' },
            { field: 'recurrence', className: 'hidden md:table-cell' },
          ] as { field: keyof Expense; className?: string }[]
        };
      case 'payment':
        return {
          headers: [
            { label: t('dataTabs.name') },
            { label: t('dataTabs.monthlyAmount') },
            { label: t('dataTabs.startDate'), className: 'hidden md:table-cell' },
            { label: t('dataTabs.endDate'), className: 'hidden lg:table-cell' },
            { label: t('dataTabs.numberOfInstallments'), className: 'hidden xl:table-cell' }
          ],
          fields: [
            { field: 'name' },
            { field: 'amount' },
            { field: 'startDate', className: 'hidden md:table-cell' },
            { field: 'completionDate', className: 'hidden lg:table-cell' },
            { field: 'numberOfPayments', className: 'hidden xl:table-cell' },
          ] as { field: keyof RecurringPayment; className?: string }[]
        };
      case 'oneTimePayment':
        return {
          headers: [
            { label: t('dataTabs.name') },
            { label: t('common.amount') },
            { label: t('dataTabs.dueDate'), className: 'hidden sm:table-cell' }
          ],
          fields: [
            { field: 'name' },
            { field: 'amount' },
            { field: 'dueDate', className: 'hidden sm:table-cell' },
          ] as { field: keyof OneTimePayment; className?: string }[]
        };
      default:
        return { headers: [], fields: [] };
    }
  }


  const renderCell = (item: DataTypeMap[T], field: keyof DataTypeMap[T]) => {
    const value = item[field];
    switch (type) {
      case 'income': {
        const incomeItem = item as Income;
        if (field === 'amount') return formatCurrency(incomeItem.amount);
        if (field === 'recurrence') return recurrenceMap[incomeItem.recurrence];
        break;
      }
      case 'expense': {
        const expenseItem = item as Expense;
        if (field === 'amount') return formatCurrency(expenseItem.amount);
        if (field === 'recurrence') return recurrenceMap[expenseItem.recurrence];
        break;
      }
      case 'payment': {
        const paymentItem = item as RecurringPayment;
        if (field === 'amount') return formatCurrency(paymentItem.amount);
        if (field === 'startDate') return formatDate(paymentItem.startDate);
        if (field === 'completionDate') return formatDate(paymentItem.completionDate);
        break;
      }
      case 'oneTimePayment': {
        const oneTimeItem = item as OneTimePayment;
        if (field === 'amount') return formatCurrency(oneTimeItem.amount);
        if (field === 'dueDate') return formatDate(oneTimeItem.dueDate);
        break;
      }
    }
    return String(value);
  };
  
  const { headers: tableHeaders, fields } = getHeadersAndFields(type);

  return (
    <div className="mt-4">
      <ScrollArea className="h-72">
        <Table>
          <TableHeader>
            <TableRow>
              {tableHeaders.map(header => (
                <TableHead key={header.label} className={header.className}>{header.label}</TableHead>
              ))}
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map(item => (
                <TableRow key={item.id}>
                  {fields.map((fieldInfo) => (
                      <TableCell key={String(fieldInfo.field)} className={fieldInfo.className}>{renderCell(item, fieldInfo.field as any)}</TableCell>
                  ))}
                  <TableCell className="text-right p-2 sm:p-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit({...item, type})}>
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>{t('common.edit')}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(type, item.id)} className="text-destructive focus:text-destructive">
                           <Trash2 className="mr-2 h-4 w-4" />
                          <span>{t('common.delete')}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={fields.length + 1} className="h-24 text-center">
                  {t('dataTabs.noData')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
