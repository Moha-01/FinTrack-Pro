
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { PlusCircle, MoreHorizontal, Trash2, Landmark, Wallet, Percent, PiggyBank } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type { SavingsAccount } from '@/types/fintrack';

interface SavingsAccountsCardProps {
  accounts: SavingsAccount[];
  onAddAccountClick: () => void;
  onDeleteAccount: (accountId: string) => void;
}

export function SavingsAccountsCard({ accounts, onAddAccountClick, onDeleteAccount }: SavingsAccountsCardProps) {
  const { t, formatCurrency } = useSettings();
  const totalAmount = accounts.reduce((sum, acc) => sum + acc.amount, 0);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            <CardTitle>{t('savingsAccounts.title')}</CardTitle>
        </div>
        <CardDescription>{t('savingsAccounts.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        {accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-8">
            <PiggyBank className="w-12 h-12 mb-4" />
            <p>{t('savingsAccounts.noAccounts')}</p>
          </div>
        ) : (
          accounts.map(account => (
            <AccountItem key={account.id} account={account} onDelete={onDeleteAccount} />
          ))
        )}
      </CardContent>
       {accounts.length > 0 && (
        <CardFooter className="flex-col items-start gap-2 border-t pt-4">
          <div className="flex w-full justify-between font-semibold">
            <span>{t('savingsAccounts.total')}</span>
            <span>{formatCurrency(totalAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">{t('savingsAccounts.totalHint')}</p>
        </CardFooter>
      )}
       <CardFooter className="flex justify-center pt-4">
        <Button onClick={onAddAccountClick} size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('savingsAccounts.addAccount')}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AccountItem({ account, onDelete }: { account: SavingsAccount; onDelete: (id: string) => void; }) {
  const { t, formatCurrency } = useSettings();

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
        <div className="flex items-center gap-3">
            {account.name.toLowerCase().includes('bargeld') || account.name.toLowerCase().includes('cash') ? <Wallet className="h-5 w-5 text-muted-foreground" /> : <Landmark className="h-5 w-5 text-muted-foreground" />}
            <div>
                <p className="font-semibold">{account.name}</p>
                <p className="text-sm text-muted-foreground">{formatCurrency(account.amount)}</p>
            </div>
        </div>
        <div className="flex items-center gap-2">
            {account.interestRate && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                    <Percent className="h-4 w-4" />
                    <span>{account.interestRate.toFixed(2)}%</span>
                </div>
            )}
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('profileManager.deleteProfileDescription', { profileName: account.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(account.id)}>{t('common.delete')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
        </div>
    </div>
  );
}
