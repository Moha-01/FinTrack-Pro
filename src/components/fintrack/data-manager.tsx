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
import { MoreHorizontal, Archive, FileText, CheckCircle, Circle, Pencil, Trash2 } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type {
  Transaction,
} from '@/types/fintrack';
import { format, parseISO, isPast } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface DataManagerProps {
  transactions: Transaction[];
  onAddClick: () => void;
  onEditClick: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onRowClick: (transaction: Transaction) => void;
  onToggleStatus: (id: string) => void;
}

const transactionGroups = [
    { type: 'income', label: 'common.income'},
    { type: 'expense', label: 'common.expense'},
    { type: 'recurringPayment', label: 'common.recurringPayment'},
    { type: 'oneTimePayment', label: 'common.oneTimePayment'},
]

export function DataManager({
  transactions,
  onEditClick,
  onDelete,
  onRowClick,
  onToggleStatus,
}: DataManagerProps) {
  const { t, formatCurrency } = useSettings();

  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { current: Transaction[], archived: Transaction[] }> = {
      income: { current: [], archived: [] },
      expense: { current: [], archived: [] },
      recurringPayment: { current: [], archived: [] },
      oneTimePayment: { current: [], archived: [] },
    };

    transactions.forEach(t => {
      let groupKey = '';
      if (t.category === 'payment') {
        groupKey = t.recurrence === 'once' ? 'oneTimePayment' : 'recurringPayment';
      } else {
        groupKey = t.category;
      }
      
      if (!groups[groupKey]) return;

      let isArchived = false;
      if (t.recurrence === 'once') {
        isArchived = t.status === 'paid';
      } else if (t.category === 'payment' && t.installmentDetails) { // Only recurring payments can be archived
        isArchived = isPast(parseISO(t.installmentDetails.completionDate));
      }

      if (isArchived) {
        groups[groupKey].archived.push(t);
      } else {
        groups[groupKey].current.push(t);
      }
    });

    // Sort items
    Object.values(groups).forEach(group => {
      group.current.sort((a,b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
      group.archived.sort((a,b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    });

    return groups;
  }, [transactions]);

  return (
    <div className="space-y-6">
        {transactionGroups.map(({type, label}) => {
            const group = groupedTransactions[type as keyof typeof groupedTransactions];
            if (!group || (group.current.length === 0 && group.archived.length === 0)) {
                return null;
            }

            const totalAmount = group.current.reduce((sum, item) => item.recurrence !== 'once' ? sum + item.amount : sum, 0);
            const oneTimeTotal = group.current.reduce((sum, item) => item.recurrence === 'once' ? sum + item.amount : sum, 0);

            const archivedTotalAmount = group.archived.reduce((sum, item) => sum + item.amount, 0) || 0;

            return (
                <Card key={type}>
                    <CardHeader>
                        <CardTitle>{t(label)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="overflow-x-auto">
                         <DataTable 
                          data={group.current} 
                          onEdit={onEditClick} 
                          onDelete={onDelete}
                          onRowClick={onRowClick}
                          onToggleStatus={onToggleStatus}
                          isArchived={false}
                        />
                       </div>
                        {group.archived && group.archived.length > 0 && (
                          <Accordion type="single" collapsible className="px-4">
                            <AccordionItem value="archive">
                              <AccordionTrigger>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Archive className="h-4 w-4" />
                                  {t('dataTabs.archive')} ({group.archived.length})
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                  <div className="overflow-x-auto">
                                      <DataTable
                                          data={group.archived}
                                          onEdit={onEditClick}
                                          onDelete={onDelete}
                                          onRowClick={onRowClick}
                                          onToggleStatus={onToggleStatus}
                                          isArchived={true}
                                      />
                                  </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        )}
                    </CardContent>
                     {(totalAmount > 0 || archivedTotalAmount > 0 || oneTimeTotal > 0) && (
                        <CardFooter className="flex-col items-stretch pt-4">
                            {totalAmount > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium mb-2 px-2">
                                    <span>{t('dataTabs.totalCurrent')} ({t('dataTabs.monthly')})</span>
                                    <span className="font-mono">{formatCurrency(totalAmount)}</span>
                                </div>
                            )}
                             {oneTimeTotal > 0 && (
                                <div className="flex justify-between items-center text-sm font-medium mb-2 px-2">
                                    <span>{t('dataTabs.totalCurrent')} ({t('common.oneTimePayment')})</span>
                                    <span className="font-mono">{formatCurrency(oneTimeTotal)}</span>
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

interface DataTableProps {
  data: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onRowClick: (transaction: Transaction) => void;
  onToggleStatus?: (id: string) => void;
  isArchived: boolean;
  title?: string;
}

function DataTable({ data, onEdit, onDelete, onRowClick, onToggleStatus, isArchived, title }: DataTableProps) {
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

  const recurrenceMap: Record<Transaction['recurrence'], string> = {
    once: t('common.oneTimePayment'),
    monthly: t('dataTabs.monthly'),
    yearly: t('dataTabs.yearly'),
  };
  
  const headers = [
      { key: 'name', label: t('dataTabs.name'), className: 'w-[40%]' },
      { key: 'amount', label: t('dataTabs.amount'), className: 'text-right' },
      { key: 'recurrence', label: t('dataTabs.recurrence'), className: 'hidden md:table-cell text-center' },
      { key: 'date', label: t('dataTabs.date'), className: 'hidden md:table-cell text-right' },
  ];


  const renderCell = (item: Transaction, headerKey: string) => {
    const value = (item as any)[headerKey];

    switch (headerKey) {
      case 'amount':
        return formatCurrency(value);
      case 'recurrence':
        return recurrenceMap[value as keyof typeof recurrenceMap];
      case 'date':
        return formatDate(value);
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
          data.map((item) => (
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
                       {item.recurrence === 'once' && onToggleStatus && (
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
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="text-destructive focus:text-destructive">
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
