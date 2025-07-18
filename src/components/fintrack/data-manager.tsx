
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
            {activeView === 'income' && <DataList type="income" data={income} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'expense' && <DataList type="expense" data={expenses} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'payment' && <DataList type="payment" data={payments} onEdit={onEditClick} onDelete={onDelete} />}
            {activeView === 'oneTimePayment' && <DataList type="oneTimePayment" data={oneTimePayments} onEdit={onEditClick} onDelete={onDelete} />}
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

interface DataListProps<T extends TransactionType> {
  type: T;
  data: DataTypeMap[T][];
  onEdit: (transaction: AnyTransaction) => void;
  onDelete: (type: T, id: string) => void;
}

function DataList<T extends TransactionType>({ type, data, onEdit, onDelete }: DataListProps<T>) {
  const { t, formatCurrency, language } = useSettings();
  const locale = language === 'de' ? de : enUS;

  const formatDate = (dateString: string) => format(parseISO(dateString), "P", { locale });

  const recurrenceMap = {
    monthly: t('dataTabs.monthly'),
    yearly: t('dataTabs.yearly'),
  };

  const renderContent = (item: DataTypeMap[T]) => {
    switch (type) {
      case 'income':
        const incomeItem = item as Income;
        return (
          <>
            <DataItem label={t('dataTabs.source')} value={incomeItem.source} />
            <DataItem label={t('common.amount')} value={formatCurrency(incomeItem.amount)} />
            <DataItem label={t('dataTabs.recurrence')} value={recurrenceMap[incomeItem.recurrence]} />
          </>
        );
      case 'expense':
        const expenseItem = item as Expense;
        return (
          <>
            <DataItem label={t('dataTabs.category')} value={expenseItem.category} />
            <DataItem label={t('common.amount')} value={formatCurrency(expenseItem.amount)} />
            <DataItem label={t('dataTabs.recurrence')} value={recurrenceMap[expenseItem.recurrence]} />
          </>
        );
      case 'payment':
        const paymentItem = item as RecurringPayment;
        return (
          <>
            <DataItem label={t('dataTabs.name')} value={paymentItem.name} />
            <DataItem label={t('dataTabs.monthlyAmount')} value={formatCurrency(paymentItem.amount)} />
            <DataItem label={t('dataTabs.startDate')} value={formatDate(paymentItem.startDate)} />
            <DataItem label={t('dataTabs.endDate')} value={formatDate(paymentItem.completionDate)} />
            <DataItem label={t('dataTabs.numberOfInstallments')} value={paymentItem.numberOfPayments.toString()} />
          </>
        );
      case 'oneTimePayment':
        const oneTimeItem = item as OneTimePayment;
        return (
          <>
            <DataItem label={t('dataTabs.name')} value={oneTimeItem.name} />
            <DataItem label={t('common.amount')} value={formatCurrency(oneTimeItem.amount)} />
            <DataItem label={t('dataTabs.dueDate')} value={formatDate(oneTimeItem.dueDate)} />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4">
      <ScrollArea className="h-72 pr-4">
        <div className="space-y-3">
          {data.length > 0 ? (
            data.map(item => (
              <div key={item.id} className="border p-4 rounded-lg bg-muted/30 flex justify-between items-start">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm flex-1">
                  {renderContent(item)}
                </div>
                <div className="ml-2">
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
                </div>
              </div>
            ))
          ) : (
            <div className="h-24 flex items-center justify-center text-center text-muted-foreground">
              {t('dataTabs.noData')}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

const DataItem = ({ label, value }: { label: string, value: string }) => (
  <>
    <div className="font-medium text-muted-foreground">{label}</div>
    <div className="text-right truncate">{value}</div>
  </>
);

    