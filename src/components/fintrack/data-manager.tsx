
"use client";

import React, { useMemo } from 'react';
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
import { PlusCircle, Trash2, Pencil, MoreHorizontal, Archive, FileText, CheckCircle, Circle } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type {
  Income,
  Expense,
  RecurringPayment,
  OneTimePayment,
  AnyTransaction,
  TransactionType,
  OneTimeIncome,
} from '@/types/fintrack';
import { format, parseISO, isPast } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '../ui/separator';

interface DataManagerProps {
  income: Income[];
  oneTimeIncomes: OneTimeIncome[];
  expenses: Expense[];
  payments: RecurringPayment[];
  oneTimePayments: OneTimePayment[];
  onAddClick: () => void;
  onEditClick: (transaction: AnyTransaction) => void;
  onDelete: (type: TransactionType, id: string) => void;
  onRowClick: (transaction: AnyTransaction) => void;
  onToggleOneTimePaymentStatus: (id: string) => void;
}

export function DataManager({
  income,
  oneTimeIncomes,
  expenses,
  payments,
  oneTimePayments,
  onAddClick,
  onEditClick,
  onDelete,
  onRowClick,
  onToggleOneTimePaymentStatus,
}: DataManagerProps) {
  const { t, formatCurrency } = useSettings();

  const { 
    currentOneTimePayments, 
    archivedOneTimePayments,
    currentRecurringPayments,
    archivedRecurringPayments,
  } = useMemo(() => {
    const currentOtp: OneTimePayment[] = [];
    const archivedOtp: OneTimePayment[] = [];
    oneTimePayments.forEach(p => {
      if (p.status === 'paid') {
        archivedOtp.push(p);
      } else {
        currentOtp.push(p);
      }
    });

    const currentRp: RecurringPayment[] = [];
    const archivedRp: RecurringPayment[] = [];
    payments.forEach(p => {
      if (isPast(parseISO(p.completionDate))) {
        archivedRp.push(p);
      } else {
        currentRp.push(p);
      }
    });

    return { 
      currentOneTimePayments: currentOtp.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime()),
      archivedOneTimePayments: archivedOtp.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime()),
      currentRecurringPayments: currentRp,
      archivedRecurringPayments: archivedRp.sort((a,b) => parseISO(b.completionDate).getTime() - parseISO(a.completionDate).getTime())
    };
  }, [oneTimePayments, payments]);

  const dataMap: Record<TransactionType, { label: string; data: AnyTransaction[]; archivedData?: AnyTransaction[] }> = {
    income: { label: t('common.income'), data: income },
    oneTimeIncome: { label: t('common.oneTimeIncome'), data: oneTimeIncomes },
    expense: { label: t('common.expenses'), data: expenses },
    payment: { label: t('common.recurringPayment'), data: currentRecurringPayments, archivedData: archivedRecurringPayments },
    oneTimePayment: { label: t('common.oneTimePayment'), data: currentOneTimePayments, archivedData: archivedOneTimePayments },
  };

  return (
    <div className="space-y-6">
        {Object.entries(dataMap).map(([type, { label, data, archivedData }]) => {
            if (data.length === 0 && (!archivedData || archivedData.length === 0)) {
                return null;
            }

            const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
            const archivedTotalAmount = archivedData?.reduce((sum, item) => sum + item.amount, 0) || 0;

            return (
                <Card key={type}>
                    <CardHeader>
                        <CardTitle>{label}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="overflow-x-auto">
                         <DataTable 
                          type={type as TransactionType} 
                          data={data} 
                          onEdit={onEditClick} 
                          onDelete={onDelete}
                          onRowClick={onRowClick}
                          onToggleStatus={onToggleOneTimePaymentStatus}
                          isArchived={false}
                        />
                       </div>
                        {archivedData && archivedData.length > 0 && (
                          <Accordion type="single" collapsible className="px-4">
                            <AccordionItem value="archive">
                              <AccordionTrigger>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Archive className="h-4 w-4" />
                                  {t('dataTabs.archive')} ({archivedData.length})
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="overflow-x-auto">
                                      <DataTable
                                          type={type as TransactionType}
                                          data={archivedData}
                                          onEdit={onEditClick}
                                          onDelete={onDelete}
                                          onRowClick={onRowClick}
                                          onToggleStatus={onToggleOneTimePaymentStatus}
                                          isArchived={true}
                                      />
                                  </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                    </CardContent>
                     {(totalAmount > 0 || archivedTotalAmount > 0) && (
                        <CardFooter className="flex-col items-stretch pt-4">
                            {totalAmount > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium mb-2 px-2">
                                    <span>{t('dataTabs.totalCurrent')}</span>
                                    <span className="font-mono">{formatCurrency(totalAmount)}</span>
                                </div>
                            )}
                            {archivedTotalAmount > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium text-muted-foreground px-2">
                                    <span>{t('dataTabs.totalArchived')}</span>
                                    <span className="font-mono">{formatCurrency(archivedTotalAmount)}</span>
                                </div>
                            )}
                        </CardFooter>
                    )}
                </Card>
            )
        })}
    </div>
  );
}

interface DataTableProps<T extends AnyTransaction> {
  type: TransactionType;
  data: T[];
  onEdit: (transaction: AnyTransaction) => void;
  onDelete: (type: TransactionType, id: string) => void;
  onRowClick: (transaction: AnyTransaction) => void;
  onToggleStatus?: (id: string) => void;
  isArchived: boolean;
  title?: string;
}

function DataTable<T extends AnyTransaction>({ type, data, onEdit, onDelete, onRowClick, onToggleStatus, isArchived, title }: DataTableProps<T>) {
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
      { key: 'recurrence', label: t('dataTabs.recurrence'), className: 'hidden md:table-cell text-center' },
      { key: 'date', label: t('dataTabs.date'), className: 'hidden md:table-cell text-right' },
    ],
    oneTimeIncome: [
      { key: 'source', label: t('dataTabs.source'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'date', label: t('dataTabs.date'), className: 'hidden md:table-cell text-right' },
    ],
    expense: [
      { key: 'category', label: t('dataTabs.category'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'recurrence', label: t('dataTabs.recurrence'), className: 'hidden md:table-cell text-center' },
      { key: 'date', label: t('dataTabs.dueDate'), className: 'hidden md:table-cell text-right' },
    ],
    payment: [
      { key: 'name', label: t('dataTabs.name'), className: 'w-[30%]' },
      { key: 'amount', label: t('dataTabs.installmentAmount'), className: 'text-right' },
      { key: 'date', label: t('dataTabs.startDate'), className: 'hidden md:table-cell text-center' },
      { key: 'completionDate', label: t('dataTabs.endDate'), className: 'hidden md:table-cell text-center' },
      { key: 'numberOfPayments', label: '# ' + t('dataTabs.installments'), className: 'text-center' },
    ],
    oneTimePayment: [
      { key: 'name', label: t('dataTabs.name'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'date', label: t('dataTabs.dueDate'), className: 'hidden md:table-cell text-right' },
    ],
  }[type];


  const renderCell = (item: AnyTransaction, headerKey: string) => {
    const value = (item as any)[headerKey];
    if (value === undefined || value === null) return '-';

    switch (headerKey) {
      case 'amount':
        return formatCurrency(value);
      case 'recurrence':
        return recurrenceMap[value as 'monthly' | 'yearly'];
      case 'date':
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
          data.map((item: AnyTransaction) => (
            <TableRow key={item.id} onClick={() => onRowClick(item)} className="cursor-pointer">
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
                       <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRowClick(item); }}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>{t('dataTabs.viewDetails')}</span>
                      </DropdownMenuItem>
                       {item.type === 'oneTimePayment' && onToggleStatus && (
                         <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {e.stopPropagation(); onToggleStatus(item.id)}}>
                            {isArchived ? (
                                <>
                                <Circle className="mr-2 h-4 w-4" />
                                <span>{t('dataTabs.markAsUnpaid')}</span>
                                </>
                            ) : (
                                <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                <span>{t('dataTabs.markAsPaid')}</span>
                                </>
                            )}
                          </DropdownMenuItem>
                         </>
                       )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(item); }}>
                        <Pencil className="mr-2 h-4 w-4" />
                        <span>{t('common.edit')}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item.type, item.id); }} className="text-destructive focus:text-destructive">
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
