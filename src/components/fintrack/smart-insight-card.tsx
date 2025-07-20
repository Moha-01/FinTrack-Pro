
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
    const totalExpenses = totalMonthlyExpenses + totalMonthlyPayments;
    const netMonthlySavings = totalMonthlyIncome - totalExpenses;
    
    const allExpenses = [
        ...expenses.map(e => ({ name: e.category, amount: e.recurrence === 'monthly' ? e.amount : e.amount / 12 })),
        ...payments.map(p => ({ name: p.name, amount: p.amount }))
    ];

    const topExpenses = allExpenses.sort((a,b) => b.amount - a.amount).slice(0, 3);
    
    const dataSummary = {
        currentBalance,
        totalMonthlyIncome,
        totalMonthlyExpenses: totalExpenses,
        netMonthlySavings,
        savingsRate: totalMonthlyIncome > 0 ? (netMonthlySavings / totalMonthlyIncome) * 100 : 0,
        topExpenses,
    };

    return `
      You are a friendly, insightful financial advisor. Your goal is to provide a brief, actionable insight based on the user's financial data.
      The user's language is: ${language}. Respond *only* in that language.

      **Your Task:**
      Based on the financial summary below, provide a two-part response:
      1.  **Analysis:** A single, concise sentence that summarizes the user's financial situation.
      2.  **Recommendation:** A single, actionable tip to improve their finances.

      **Formatting Rules:**
      - Start the entire response with a single, relevant emoji (e.g., 📈,💡,💰).
      - Do NOT use markdown.
      - Keep the entire response under 75 words.

      **Financial Summary:**
      - Monthly Income: ${dataSummary.totalMonthlyIncome.toFixed(2)}
      - Monthly Expenses: ${dataSummary.totalMonthlyExpenses.toFixed(2)}
      - Net Monthly Savings: ${dataSummary.netMonthlySavings.toFixed(2)}
      - Savings Rate: ${dataSummary.savingsRate.toFixed(1)}%
      - Top 3 Monthly Expenses: ${dataSummary.topExpenses.map(e => `${e.name} (${e.amount.toFixed(2)})`).join(', ') || 'None'}
    `;
  }, [profileData, language]);

  const fetchInsight = useCallback(async () => {
    if (!geminiApiKey) {
      setError(t('ai.apiKeyMissing'));
      return;
    }

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
    if (geminiApiKey) {
        fetchInsight();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileData, geminiApiKey]);

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
          <p className="text-sm text-foreground whitespace-pre-line">{insight}</p>
        )}
        {!isLoading && !error && !insight && (
           <p className="text-sm text-muted-foreground">{t('ai.noInsight')}</p>
        )}
      </CardContent>
    </Card>
  );
}
