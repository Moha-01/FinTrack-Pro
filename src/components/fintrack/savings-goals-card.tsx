
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, Trash2, PiggyBank, Target, Link, Wallet, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type { SavingsGoal, SavingsAccount } from '@/types/fintrack';

interface SavingsGoalsCardProps {
  goals: SavingsGoal[];
  accounts: SavingsAccount[];
  currentBalance: number;
  onAddGoalClick: () => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoal: (goalId: string, amount: number) => void;
  onEditGoal: (goal: SavingsGoal) => void;
  onPriorityChange: (goalId: string, direction: 'up' | 'down') => void;
}

export function SavingsGoalsCard({ goals, accounts, currentBalance, onAddGoalClick, onDeleteGoal, onUpdateGoal, onEditGoal, onPriorityChange }: SavingsGoalsCardProps) {
  const { t } = useSettings();

  const sortedGoals = [...goals].sort((a, b) => a.priority - b.priority);

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            <CardTitle>{t('savingsGoals.title')}</CardTitle>
        </div>
        <CardDescription>{t('savingsGoals.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 flex-grow">
        {sortedGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-8">
            <PiggyBank className="w-12 h-12 mb-4" />
            <p>{t('savingsGoals.noGoals')}</p>
          </div>
        ) : (
          sortedGoals.map((goal, index) => (
            <GoalItem 
              key={goal.id} 
              goal={goal} 
              allGoals={sortedGoals} 
              accounts={accounts} 
              currentBalance={currentBalance} 
              onDelete={onDeleteGoal} 
              onUpdate={onUpdateGoal} 
              onEdit={onEditGoal}
              onPriorityChange={onPriorityChange}
              isFirst={index === 0}
              isLast={index === sortedGoals.length - 1}
            />
          ))
        )}
      </CardContent>
       <CardFooter className="flex justify-center border-t pt-4 mt-auto">
        <Button onClick={onAddGoalClick} size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('savingsGoals.addGoal')}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface GoalItemProps {
  goal: SavingsGoal;
  allGoals: SavingsGoal[];
  accounts: SavingsAccount[];
  currentBalance: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, amount: number) => void;
  onEdit: (goal: SavingsGoal) => void;
  onPriorityChange: (id: string, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

function GoalItem({ goal, allGoals, accounts, currentBalance, onDelete, onUpdate, onEdit, onPriorityChange, isFirst, isLast }: GoalItemProps) {
  const { t, formatCurrency } = useSettings();
  const [fundsToAdd, setFundsToAdd] = useState('');
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  
  const isLinkedToMainBalance = goal.linkedAccountId === 'main_balance';
  const linkedAccount = !isLinkedToMainBalance && goal.linkedAccountId ? accounts.find(a => a.id === goal.linkedAccountId) : undefined;
  
  let currentAmount = 0;

  if (isLinkedToMainBalance || linkedAccount) {
    const accountBalance = isLinkedToMainBalance ? currentBalance : linkedAccount!.amount;
    
    // Get all goals linked to the same account, sorted by priority
    const linkedGoals = allGoals
      .filter(g => g.linkedAccountId === goal.linkedAccountId)
      .sort((a, b) => a.priority - b.priority);

    let remainingBalance = accountBalance;

    for (const g of linkedGoals) {
      const allocation = Math.min(remainingBalance, g.targetAmount);
      if (g.id === goal.id) {
        currentAmount = allocation;
        break; // Stop after finding the current goal's allocation
      }
      remainingBalance -= allocation; // Subtract the allocation for higher-priority goals
    }
    
    currentAmount = Math.max(0, currentAmount);

  } else {
    // Goal is not linked, use its own currentAmount
    currentAmount = goal.currentAmount;
  }

  const progress = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0;


  const handleAddFunds = () => {
    const amount = parseFloat(fundsToAdd);
    if (!isNaN(amount) && amount > 0) {
      onUpdate(goal.id, amount);
    }
    setFundsToAdd('');
    setIsAddFundsOpen(false);
  };
  
  const getLinkText = () => {
      if(isLinkedToMainBalance) {
          return t('savingsGoals.linkedTo', { accountName: t('summary.currentBalance') })
      }
      if(linkedAccount) {
           return t('savingsGoals.linkedTo', { accountName: linkedAccount.name })
      }
      return null;
  }
  const linkText = getLinkText();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
            <span className="font-semibold">{goal.name}</span>
            {linkText && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isLinkedToMainBalance ? <Wallet className="h-3 w-3"/> : <Link className="h-3 w-3"/>}
                    <span>{linkText}</span>
                </div>
            )}
        </div>
        <div className="flex items-center gap-2">
          {!goal.linkedAccountId && (
            <AlertDialog open={isAddFundsOpen} onOpenChange={setIsAddFundsOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">{t('savingsGoals.addFunds')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('savingsGoals.addFundsTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('savingsGoals.addFundsDescription', { goalName: goal.name })}</AlertDialogDescription>
                </AlertDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="funds-amount" className="text-right">{t('savingsGoals.amountToAdd')}</Label>
                    <Input id="funds-amount" type="number" value={fundsToAdd} onChange={(e) => setFundsToAdd(e.target.value)} className="col-span-3" />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setFundsToAdd('')}>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleAddFunds}>{t('common.add')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(goal)}>
                <Pencil className="mr-2 h-4 w-4" />
                <span>{t('common.edit')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange(goal.id, 'up')} disabled={isFirst}>
                <ArrowUp className="mr-2 h-4 w-4" />
                <span>{t('savingsGoals.increasePriority')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange(goal.id, 'down')} disabled={isLast}>
                <ArrowDown className="mr-2 h-4 w-4" />
                <span>{t('savingsGoals.decreasePriority')}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                   <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    <span>{t('common.delete')}</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('profileManager.deleteProfileDescription', { profileName: goal.name })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(goal.id)}>{t('common.delete')}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <Progress value={progress} />
      <div className="text-sm text-muted-foreground flex justify-between">
        <span>{formatCurrency(currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
