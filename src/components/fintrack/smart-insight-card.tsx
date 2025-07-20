
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, RefreshCw } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { getGenerativeInsight } from "@/lib/gemini";
import type { ProfileData } from '@/types/fintrack';

interface SmartInsightCardProps {
  profileData: ProfileData;
}

export function SmartInsightCard({ profileData }: SmartInsightCardProps) {
  const { t, geminiApiKey, language } = useSettings();
  const [insight, setInsight] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const generateInsightPrompt = useCallback(() => {
    const { income, expenses, payments, oneTimePayments, currentBalance } = profileData;

    const totalMonthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    const highestExpense = [...expenses, ...payments].sort((a, b) => b.amount - a.amount)[0];

    const dataSummary = {
        currentBalance,
        totalMonthlyIncome,
        totalMonthlyExpenses: totalMonthlyExpenses + totalMonthlyPayments,
        netMonthlySavings: totalMonthlyIncome - (totalMonthlyExpenses + totalMonthlyPayments),
        expenseCategories: expenses.map(e => ({ category: e.category, amount: e.amount, recurrence: e.recurrence })),
        recurringPayments: payments.map(p => ({ name: p.name, amount: p.amount })),
        highestExpense: highestExpense ? { name: (highestExpense as any).category || highestExpense.name, amount: highestExpense.amount } : null,
    };

    return `
      You are a friendly and helpful financial advisor.
      Analyze the following personal finance data for a user.
      The user's language is: ${language}. Respond *only* in that language.
      
      Your task is to provide:
      1. A brief, one-sentence analysis of the user's financial situation.
      2. One specific, actionable recommendation to improve their finances.
      
      Keep the entire response concise and clear, under 70 words total.
      Do not use markdown, just plain text.
      Start the response with a relevant emoji.

      Financial Data:
      ${JSON.stringify(dataSummary, null, 2)}
    `;
  }, [profileData, language]);

  const fetchInsight = useCallback(async () => {
    if (!geminiApiKey) {
      setError(t('ai.apiKeyMissing'));
      return;
    }

    // Don't run if there's no data to analyze
    if (profileData.income.length === 0 && profileData.expenses.length === 0 && profileData.payments.length === 0) {
        setInsight('');
        setError('');
        return;
    }

    setIsLoading(true);
    setError('');
    setInsight('');

    const prompt = generateInsightPrompt();
    const result = await getGenerativeInsight(geminiApiKey, prompt);

    if (result.startsWith('ERROR:')) {
      setError(result.replace('ERROR:', '').trim());
    } else {
      setInsight(result);
    }
    setIsLoading(false);
  }, [geminiApiKey, generateInsightPrompt, t, profileData]);

  useEffect(() => {
    // Automatically fetch insight when component mounts or data changes, if key is present
    if (geminiApiKey) {
        fetchInsight();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, geminiApiKey]); // We only want to re-run this when the data changes, not on every fetchInsight change

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Lightbulb className="h-6 w-6 text-yellow-500" />
        <div>
          <CardTitle className="text-lg">{t('ai.title')}</CardTitle>
          <CardDescription>{t('ai.description')}</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={fetchInsight} 
          disabled={isLoading || !geminiApiKey}
          className="ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">Refresh insight</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">{t('ai.loading')}</p>}
        {!isLoading && error && (
          <div className="text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <p>{error}</p>
          </div>
        )}
        {!isLoading && !error && insight && (
          <p className="text-sm text-foreground">{insight}</p>
        )}
        {!isLoading && !error && !insight && (
           <p className="text-sm text-muted-foreground">{t('ai.noInsight')}</p>
        )}
      </CardContent>
    </Card>
  );
}
