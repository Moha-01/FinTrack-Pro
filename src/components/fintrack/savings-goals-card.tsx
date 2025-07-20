
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, MoreHorizontal, Trash2, PiggyBank, Target } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type { SavingsGoal } from '@/types/fintrack';

interface SavingsGoalsCardProps {
  goals: SavingsGoal[];
  onAddGoalClick: () => void;
  onDeleteGoal: (goalId: string) => void;
  onUpdateGoal: (goalId: string, amount: number) => void;
}

export function SavingsGoalsCard({ goals, onAddGoalClick, onDeleteGoal, onUpdateGoal }: SavingsGoalsCardProps) {
  const { t } = useSettings();

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
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full py-8">
            <PiggyBank className="w-12 h-12 mb-4" />
            <p>{t('savingsGoals.noGoals')}</p>
          </div>
        ) : (
          goals.map(goal => (
            <GoalItem key={goal.id} goal={goal} onDelete={onDeleteGoal} onUpdate={onUpdateGoal} />
          ))
        )}
      </CardContent>
       <CardFooter className="flex justify-center pt-4">
        <Button onClick={onAddGoalClick} size="sm" className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('savingsGoals.addGoal')}
        </Button>
      </CardFooter>
    </Card>
  );
}

function GoalItem({ goal, onDelete, onUpdate }: { goal: SavingsGoal; onDelete: (id: string) => void; onUpdate: (id: string, amount: number) => void; }) {
  const { t, formatCurrency } = useSettings();
  const [fundsToAdd, setFundsToAdd] = useState('');
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);
  const progress = (goal.currentAmount / goal.targetAmount) * 100;

  const handleAddFunds = () => {
    const amount = parseFloat(fundsToAdd);
    if (!isNaN(amount) && amount > 0) {
      onUpdate(goal.id, amount);
    }
    setFundsToAdd('');
    setIsAddFundsOpen(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <span className="font-semibold">{goal.name}</span>
        <div className="flex items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
        <span>{progress.toFixed(0)}%</span>
      </div>
    </div>
  );
}
