
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
  const { t, geminiApiKey, language, currency } = useSettings();
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
        currency,
        currentBalance,
        totalMonthlyIncome,
        totalMonthlyExpenses: totalExpenses,
        netMonthlySavings,
        savingsRate: totalMonthlyIncome > 0 ? (netMonthlySavings / totalMonthlyIncome) * 100 : 0,
        topExpenses,
        hasIncome: totalMonthlyIncome > 0,
        hasExpenses: totalExpenses > 0
    };

    return `
      **Persona:** You are a sharp, professional financial analyst providing a single, powerful insight.

      **Language:** Respond ONLY in ${language}.

      **Task:**
      Analyze the following financial snapshot. Your goal is to provide a holistic and professional two-part response. Avoid focusing only on expenses unless they are extraordinarily high. Consider the relationship between income, savings, and overall cash flow.

      1.  **Analysis:** Start with a bolded title (e.g., **"Analyse"**). Write one or two sentences that give a clear, professional analysis of the user's overall financial situation (e.g., strong cash flow, low savings rate despite high income, balanced budget).
      2.  **Recommendation:** Start with a bolded title (e.g., **"Empfehlung"**). Offer a single, highly specific, and actionable tip that logically follows from your analysis. This could be about optimizing savings, reviewing income streams, or restructuring recurring payments.

      **Formatting & Rules:**
      - Use the currency symbol (${currency}) when mentioning financial figures.
      - Keep the entire response professional, concise, and under 90 words.
      - Do NOT use emojis or conversational filler.
      - If there is no income or no expenses, state that a proper analysis cannot be made and that more data is needed.

      **Financial Snapshot (Currency: ${dataSummary.currency}):**
      - Current Balance: ${dataSummary.currentBalance.toFixed(2)}
      - Monthly Income: ${dataSummary.totalMonthlyIncome.toFixed(2)}
      - Total Monthly Expenses: ${dataSummary.totalMonthlyExpenses.toFixed(2)}
      - Net Monthly Savings: ${dataSummary.netMonthlySavings.toFixed(2)}
      - Savings Rate: ${dataSummary.savingsRate.toFixed(1)}%
      - Top 3 Expense Categories: ${dataSummary.topExpenses.map(e => `${e.name} (${e.amount.toFixed(2)})`).join(', ') || 'N/A'}
    `;
  }, [profileData, language, currency]);

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
