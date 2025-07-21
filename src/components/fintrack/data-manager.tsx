
"use client";

import React, { useState, useMemo } from 'react';
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
import { PlusCircle, Trash2, Pencil, MoreHorizontal, ChevronDown, Archive } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type {
  Income,
  Expense,
  RecurringPayment,
  OneTimePayment,
  AnyTransaction,
  TransactionType,
} from '@/types/fintrack';
import { format, parseISO, isPast } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@/components/ui/dropdown-menu';
import { TransactionDetailsDialog } from './transaction-details-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
  const [selectedTransaction, setSelectedTransaction] = useState<AnyTransaction | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleRowClick = (transaction: AnyTransaction) => {
    setSelectedTransaction(transaction);
    setIsDetailsOpen(true);
  };
  
  const { currentOneTimePayments, archivedOneTimePayments } = useMemo(() => {
    const current: OneTimePayment[] = [];
    const archived: OneTimePayment[] = [];
    oneTimePayments.forEach(p => {
      if (isPast(parseISO(p.dueDate))) {
        archived.push(p);
      } else {
        current.push(p);
      }
    });
    return { currentOneTimePayments: current, archivedOneTimePayments: archived.sort((a,b) => parseISO(b.dueDate).getTime() - parseISO(a.dueDate).getTime()) };
  }, [oneTimePayments]);

  const dataMap: Record<TransactionType, { label: string; data: any[] }> = {
    income: { label: t('common.income'), data: income },
    expense: { label: t('common.expenses'), data: expenses },
    payment: { label: t('common.recurringPayment'), data: payments },
    oneTimePayment: { label: t('common.oneTimePayment'), data: currentOneTimePayments },
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
                {dataMap[activeView].label}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuRadioGroup value={activeView} onValueChange={(v) => setActiveView(v as TransactionType)}>
                {Object.keys(dataMap).map((key) => (
                  <DropdownMenuRadioItem key={key} value={key as TransactionType}>
                    {dataMap[key as TransactionType].label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <DataTable 
              type={activeView} 
              data={dataMap[activeView].data} 
              onEdit={onEditClick} 
              onDelete={onDelete}
              onRowClick={handleRowClick}
              title={activeView === 'oneTimePayment' ? t('dataTabs.upcomingPayments') : undefined}
            />
          </div>
          {activeView === 'oneTimePayment' && archivedOneTimePayments.length > 0 && (
            <Accordion type="single" collapsible className="px-4">
              <AccordionItem value="archive">
                <AccordionTrigger>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Archive className="h-4 w-4" />
                    {t('dataTabs.archive')} ({archivedOneTimePayments.length})
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="overflow-x-auto">
                        <DataTable
                            type="oneTimePayment"
                            data={archivedOneTimePayments}
                            onEdit={onEditClick}
                            onDelete={onDelete}
                            onRowClick={handleRowClick}
                        />
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-4 mt-4">
            <Button onClick={onAddClick} size="sm" className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dataTabs.addTransaction')}
            </Button>
        </CardFooter>
        <TransactionDetailsDialog 
            isOpen={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            transaction={selectedTransaction}
        />
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
  onRowClick: (transaction: AnyTransaction) => void;
  title?: string;
}


function DataTable<T extends TransactionType>({ type, data, onEdit, onDelete, onRowClick, title }: DataTableProps<T>) {
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
      { key: 'completionDate', label: t('dataTabs.endDate'), className: 'hidden md:table-cell text-center' },
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
      case 'completionDate':
      case 'dueDate':
        return formatDate(value);
      case 'numberOfPayments':
        return value;
      default:
        return value;
    }
  };

  return (
    <Table>
       {title && (
          <caption className="px-4 py-2 text-left text-sm font-semibold text-foreground caption-top">
            {title}
          </caption>
        )}
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
          data.map((item: any) => (
            <TableRow key={item.id} onClick={() => onRowClick({ ...item, type })} className="cursor-pointer">
              {headers.map(header => (
                <TableCell key={header.key} className={`${header.className || ''} py-2`}>
                  {renderCell(item, header.key)}
                </TableCell>
              ))}
              <TableCell className="text-right py-2 pr-4" onClick={(e) => e.stopPropagation()}>
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

    