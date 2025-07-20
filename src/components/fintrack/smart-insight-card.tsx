
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
    };

    return `
      **Persona:** You are a professional yet approachable financial analyst. Your goal is to provide a sharp, data-driven insight and a concrete recommendation based on the provided financial snapshot.

      **Language:** Respond ONLY in ${language}.

      **Task:**
      Analyze the following financial data. Based on your analysis, provide a two-part response:
      1.  **Insight:** Start with a bolded, single-word title (e.g., **"Analyse"** or **"Insight"**). Follow with one or two sentences that give a clear, professional analysis of the user's financial situation. You could comment on their savings rate, expense allocation, or cash flow.
      2.  **Recommendation:** Start with a bolded, single-word title (e.g., **"Empfehlung"** or **"Recommendation"**). Follow with one or two sentences that offer a single, highly specific, and actionable tip. This tip should be a logical next step based on your insight. For example, if expenses are high, suggest a specific category to review.

      **Formatting & Rules:**
      - Use the currency symbol (${currency}) when mentioning financial figures.
      - Do NOT use emojis.
      - Keep the entire response professional, concise, and under 90 words.
      - Do NOT add any extra conversational text. Respond ONLY with the Insight and Recommendation.

      **Financial Snapshot (Currency: ${dataSummary.currency}):**
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
