
"use client";

import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
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
                  <DropdownMenuRadioItem key={key} value={key as TransactionType}>
                    {typeMap[key as TransactionType].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {activeView === 'income' && <DataTable type="income" data={income} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'expense' && <DataTable type="expense" data={expenses} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'payment' && <DataTable type="payment" data={payments} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'oneTimePayment' && <DataTable type="oneTimePayment" data={oneTimePayments} onEdit={onEditClick} onDelete={onDelete} />}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
            <Button onClick={onAddClick} size="sm" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dataTabs.addTransaction')}
            </Button>
        </CardFooter>
      </Card>
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
  data: (DataTypeMap[T])[];
  onEdit: (transaction: AnyTransaction) => void;
  onDelete: (type: T, id: string) => void;
}


function DataTable<T extends TransactionType>({ type, data, onEdit, onDelete }: DataTableProps<T>) {
  const { t, formatCurrency, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const parsedDate = parseISO(dateString);
      if (isNaN(parsedDate.getTime())) {
        return ''; 
      }
      return format(parsedDate, "P", { locale });
    } catch (e) {
      return '';
    }
  }

  const recurrenceMap = {
    monthly: t('dataTabs.monthly'),
    yearly: t('dataTabs.yearly'),
  };

  const headers = {
    income: [
      { key: 'source', label: t('dataTabs.source'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'recurrence', label: t('dataTabs.recurrence'), className: 'hidden md:table-cell text-right' },
    ],
    expense: [
      { key: 'category', label: t('dataTabs.category'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'recurrence', label: t('dataTabs.recurrence'), className: 'hidden md:table-cell text-right' },
    ],
    payment: [
      { key: 'name', label: t('dataTabs.name'), className: 'w-[30%]' },
      { key: 'amount', label: t('dataTabs.monthlyAmount'), className: 'text-right' },
      { key: 'startDate', label: t('dataTabs.startDate'), className: 'hidden md:table-cell text-center' },
      { key: 'completionDate', label: t('dataTabs.endDate'), className: 'hidden lg:table-cell text-center' },
      { key: 'numberOfPayments', label: '# ' + t('dataTabs.numberOfInstallments'), className: 'text-center' },
    ],
    oneTimePayment: [
      { key: 'name', label: t('dataTabs.name'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'dueDate', label: t('dataTabs.dueDate'), className: 'hidden md:table-cell text-right' },
    ],
  }[type];


  const renderCell = (item: any, headerKey: string) => {
    const value = item[headerKey];
    if (value === undefined || value === null) return '';

    switch (headerKey) {
      case 'amount':
        return formatCurrency(value);
      case 'recurrence':
        return recurrenceMap[value as 'monthly' | 'yearly'];
      case 'startDate':
      case 'dueDate':
      case 'completionDate':
        return formatDate(value);
      case 'numberOfPayments':
        return value;
      default:
        return value;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {headers.map(header => (
            <TableHead key={header.key} className={header.className}>{header.label}</TableHead>
          ))}
          <TableHead className="text-right w-[50px] pr-4">{t('common.actions')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.length > 0 ? (
          data.map(item => (
            <TableRow key={item.id}>
              {headers.map(header => (
                <TableCell key={header.key} className={`${header.className || ''} py-2`}>
                  {renderCell(item, header.key)}
                </TableCell>
              ))}
              <TableCell className="text-right py-2 pr-4">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit({ ...item, type })}>
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
            <TableCell colSpan={headers.length + 1} className="h-24 text-center">
              {t('dataTabs.noData')}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
