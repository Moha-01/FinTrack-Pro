
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PlusCircle, Trash2, Landmark, Wallet, Percent, PiggyBank, Link, Target, Minus, CheckCircle2, Package, PackageCheck, PackageOpen } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type { SavingsAccount, SavingsGoal } from '@/types/fintrack';
import { Separator } from '@/components/ui/separator';
import { Badge } from '../ui/badge';

interface SavingsAccountsCardProps {
  accounts: SavingsAccount[];
  goals: SavingsGoal[];
  summary: {
    totalInAccounts: number;
    totalAllocated: number;
    totalAvailable: number;
  };
  onAddAccountClick: () => void;
  onDeleteAccount: (accountId: string) => void;
}

export function SavingsAccountsCard({ accounts, goals, summary, onAddAccountClick, onDeleteAccount }: SavingsAccountsCardProps) {
  const { t, formatCurrency } = useSettings();

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
          accounts.map(account => {
            const linkedGoals = goals.filter(g => g.linkedAccountId === account.id);
            return <AccountItem key={account.id} account={account} linkedGoals={linkedGoals} onDelete={onDeleteAccount} />;
          })
        )}
      </CardContent>
       {accounts.length > 0 && (
        <CardFooter className="flex-col items-stretch gap-3 border-t pt-4 mt-auto">
          <div className="flex w-full justify-between items-center text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
                <Package className="h-4 w-4"/>
                <span>{t('savingsAccounts.total')}</span>
            </div>
            <span className="font-semibold">{formatCurrency(summary.totalInAccounts)}</span>
          </div>
          <div className="flex w-full justify-between items-center text-sm">
             <div className="flex items-center gap-1.5 text-muted-foreground">
                <PackageCheck className="h-4 w-4"/>
                <span>{t('savingsAccounts.totalAllocated')}</span>
            </div>
            <span className="font-semibold">{formatCurrency(summary.totalAllocated)}</span>
          </div>
           <div className="flex w-full justify-between items-center text-sm">
             <div className="flex items-center gap-1.5 text-muted-foreground">
                <PackageOpen className="h-4 w-4"/>
                <span>{t('savingsAccounts.totalAvailable')}</span>
            </div>
            <span className={`font-semibold ${summary.totalAvailable >= 0 ? '' : 'text-orange-500'}`}>{formatCurrency(summary.totalAvailable)}</span>
          </div>
        </CardFooter>
      )}
       <CardFooter className="flex justify-center border-t pt-4">
        <Button onClick={onAddAccountClick} size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('savingsAccounts.addAccount')}
        </Button>
      </CardFooter>
    </Card>
  );
}

function AccountItem({ account, linkedGoals, onDelete }: { account: SavingsAccount; linkedGoals: SavingsGoal[], onDelete: (id: string) => void; }) {
  const { t, formatCurrency } = useSettings();
  const allocatedAmount = linkedGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const availableAmount = account.amount - allocatedAmount;

  return (
    <div className="rounded-lg bg-muted/50 p-3 flex flex-col gap-3">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                {account.name.toLowerCase().includes('bargeld') || account.name.toLowerCase().includes('cash') ? <Wallet className="h-5 w-5 text-muted-foreground mt-1" /> : <Landmark className="h-5 w-5 text-muted-foreground mt-1" />}
                <div>
                    <p className="font-semibold">{account.name}</p>
                    <p className="text-sm font-bold text-primary">{formatCurrency(account.amount)}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                {account.interestRate != null && account.interestRate > 0 && (
                     <Badge variant="secondary" className="text-green-600">
                        <Percent className="h-3 w-3 mr-1" />
                        <span>{account.interestRate.toFixed(2)}%</span>
                    </Badge>
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
        {linkedGoals.length > 0 && (
            <>
                <Separator/>
                <div className="space-y-2 text-xs">
                    <p className="font-medium text-muted-foreground mb-1">{t('savingsAccounts.linkedGoals')}:</p>
                    {linkedGoals.map(goal => (
                        <div key={goal.id} className="flex justify-between items-center">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Target className="h-3 w-3" />
                                <span>{goal.name}</span>
                            </div>
                            <span className="font-mono text-muted-foreground">{formatCurrency(goal.targetAmount)}</span>
                        </div>
                    ))}
                    <Separator className="my-2"/>
                     <div className="flex justify-between items-center text-sm pt-1">
                        <div className="flex items-center gap-1.5 font-semibold">
                           {availableAmount >= 0 ? <CheckCircle2 className="h-4 w-4 text-green-600"/> : <Minus className="h-4 w-4 text-orange-500"/>}
                           <span>{t('savingsAccounts.availableAmount')}</span>
                        </div>
                        <span className={`font-mono font-semibold ${availableAmount >= 0 ? 'text-green-600' : 'text-orange-500'}`}>{formatCurrency(availableAmount)}</span>
                     </div>
                </div>
            </>
        )}
    </div>
  );
}
