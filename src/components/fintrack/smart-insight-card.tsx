
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, RefreshCw } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import { getGenerativeInsight } from "@/lib/gemini";
import type { ProfileData } from '@/types/fintrack';
import ReactMarkdown from 'react-markdown';

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
    
    const dataSummary = {
        currency,
        currentBalance,
        totalMonthlyIncome,
        totalMonthlyExpenses: totalExpenses,
        allIncome: income,
        allExpenses: expenses,
        allPayments: payments,
        allOneTimePayments: oneTimePayments,
    };

    return `
      As a friendly and modern financial advisor, analyze the following financial data.
      Respond in ${language}.
      Feel free to use emojis to make your advice more engaging.
      Use Markdown formatting (like bold text and lists) to present the information clearly. Do NOT use tables.

      **Financial Snapshot (Currency: ${dataSummary.currency}):**
      - Current Balance: ${dataSummary.currentBalance.toFixed(2)}
      - Monthly Income: ${dataSummary.totalMonthlyIncome.toFixed(2)}
      - Total Monthly Expenses: ${dataSummary.totalMonthlyExpenses.toFixed(2)}
      
      **Detailed Data:**
      - All Income sources: ${JSON.stringify(dataSummary.allIncome)}
      - All recurring expenses: ${JSON.stringify(dataSummary.allExpenses)}
      - All recurring payments (installments): ${JSON.stringify(dataSummary.allPayments)}
      - All one-time payments for the upcoming period: ${JSON.stringify(dataSummary.allOneTimePayments)}
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
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                p: ({node, ...props}) => <p className="text-sm text-foreground" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-lg font-semibold" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-base font-semibold" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-sm font-semibold" {...props} />,
              }}
            >{insight}</ReactMarkdown>
          </div>
        )}
        {!isLoading && !error && !insight && (
           <p className="text-sm text-muted-foreground">{t('ai.noInsight')}</p>
        )}
      </CardContent>
    </Card>
  );
}
