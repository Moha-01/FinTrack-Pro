
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Edit, PlusCircle, DollarSign, CreditCard, CalendarClock, AlertCircle } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import type { Transaction, Income, Expense, RecurringPayment, OneTimePayment } from "@/types/fintrack";
import { format, parseISO } from "date-fns";
import { de, enUS } from 'date-fns/locale';
import { AddTransactionDialog } from "./add-transaction-dialog";
import { Badge } from "@/components/ui/badge";

interface DataManagerProps {
  transactions: Transaction[];
  onAdd: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', data: any) => void;
  onUpdate: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', data: any) => void;
  onDelete: (type: 'income' | 'expense' | 'payment' | 'oneTimePayment', id: string) => void;
}

export function DataManager({ transactions, onAdd, onUpdate, onDelete }: DataManagerProps) {
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

  const typeMap = {
    income: { label: t('common.income'), icon: <DollarSign className="w-4 h-4 mr-2" /> },
    expense: { label: t('common.expense'), icon: <CreditCard className="w-4 h-4 mr-2" /> },
    payment: { label: t('common.recurringPayment'), icon: <CalendarClock className="w-4 h-4 mr-2" /> },
    oneTimePayment: { label: t('common.oneTimePayment'), icon: <AlertCircle className="w-4 h-4 mr-2" /> },
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
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('dataManager.title')}</CardTitle>
            <CardDescription>{t('dataManager.description')}</CardDescription>
          </div>
          <Button onClick={handleAddClick} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            {t('dataManager.addTransaction')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <ScrollArea className="max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('common.type')}</TableHead>
                    <TableHead>{t('common.nameSourceCategory')}</TableHead>
                    <TableHead>{t('common.amount')}</TableHead>
                    <TableHead>{t('common.details')}</TableHead>
                    <TableHead className="text-right">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        {t('dataManager.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    transactions.map(item => (
                      <TableRow key={item.id}>
                        <TableCell>
                           <Badge variant="secondary" className="whitespace-nowrap flex items-center w-fit">
                             {typeMap[item.type].icon}
                             {typeMap[item.type].label}
                           </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {'source' in item ? item.source : 'category' in item ? item.category : item.name}
                        </TableCell>
                        <DataTableCell item={item} />
                        <DataTableDetailsCell item={item} />
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)} className="text-muted-foreground hover:text-primary transition-colors">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDelete(item.type, item.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

const DataTableCell = ({ item }: { item: Transaction }) => {
    const { formatCurrency } = useSettings();
    const isIncome = item.type === 'income';
    const textColor = isIncome ? 'text-green-600' : 'text-red-600';

    return (
        <TableCell className={`font-mono ${textColor}`}>
            {isIncome ? '+' : '-'} {formatCurrency(item.amount)}
        </TableCell>
    );
};

const DataTableDetailsCell = ({ item }: { item: Transaction }) => {
    const { t, language } = useSettings();
    const locale = language === 'de' ? de : enUS;
    const formatDate = (dateString: string) => format(parseISO(dateString), "P", { locale });

    const recurrenceMap = {
        monthly: t('dataTabs.monthly'),
        yearly: t('dataTabs.yearly'),
    };
    
    switch (item.type) {
        case 'income':
        case 'expense':
            return <TableCell>{recurrenceMap[item.recurrence]}</TableCell>;
        case 'payment':
            return <TableCell className="text-xs">{item.numberOfPayments} {t('common.expenses')} / {t('dataTabs.endDate')}: {formatDate(item.completionDate)}</TableCell>;
        case 'oneTimePayment':
            return <TableCell className="text-xs">{t('dataTabs.dueDate')}: {formatDate(item.dueDate)}</TableCell>;
        default:
            return <TableCell></TableCell>;
    }
};

