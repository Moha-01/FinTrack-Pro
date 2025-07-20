
"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, RefreshCw, KeyRound, Sparkles } from "lucide-react";
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
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateInsightPrompt = useCallback(() => {
    const { income, expenses, payments, oneTimePayments, currentBalance, savingsGoals, savingsAccounts } = profileData;

    const totalMonthlyIncome = income.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyExpenses = expenses.reduce((sum, item) => sum + (item.recurrence === 'yearly' ? item.amount / 12 : item.amount), 0);
    const totalMonthlyPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = totalMonthlyExpenses + totalMonthlyPayments;
    const netSavings = totalMonthlyIncome - totalExpenses;
    const savingsRate = totalMonthlyIncome > 0 ? (netSavings / totalMonthlyIncome) * 100 : 0;
    
    const dataSummary = {
        currency,
        currentBalance,
        totalMonthlyIncome,
        totalMonthlyExpenses: totalExpenses,
        netMonthlySavings: netSavings,
        savingsRate: savingsRate.toFixed(2),
        allIncomeSources: income,
        allExpenseItems: expenses,
        allRecurringPayments: payments,
        allOneTimePayments: oneTimePayments,
        savingsGoals,
        savingsAccounts,
    };

    return `
      You are a modern and friendly financial advisor. Your goal is to provide a concise but insightful analysis based on the user's financial data.
      Respond in ${language}.
      Use emojis and simple Markdown like bolding. Do NOT use tables or long lists.
      Do NOT just repeat the data provided. Synthesize it into a smart observation.

      Your response should be structured as a brief paragraph. First, provide a short analysis of the overall financial situation (e.g., "Your savings rate is strong, but high monthly payments are a concern."). Then, offer one or two clear, actionable recommendations.

      Here is the user's financial data (Currency: ${dataSummary.currency}):
      - Current Balance: ${dataSummary.currentBalance}
      - Total Monthly Income: ${dataSummary.totalMonthlyIncome}
      - Total Monthly Expenses: ${dataSummary.totalMonthlyExpenses}
      - Net Monthly Savings: ${dataSummary.netMonthlySavings}
      - Savings Rate: ${dataSummary.savingsRate}%
      - Income Sources: ${JSON.stringify(dataSummary.allIncomeSources)}
      - Regular Expenses: ${JSON.stringify(dataSummary.allExpenseItems)}
      - Recurring Payments/Installments: ${JSON.stringify(dataSummary.allRecurringPayments)}
      - Upcoming One-Time Payments: ${JSON.stringify(dataSummary.allOneTimePayments)}
      - Savings Goals: ${JSON.stringify(dataSummary.savingsGoals)}
      - Savings Accounts & Assets: ${JSON.stringify(dataSummary.savingsAccounts)}
    `;
  }, [profileData, language, currency]);

  const fetchInsight = useCallback(async () => {
    if (!geminiApiKey) {
      setError(t('ai.apiKeyMissing'));
      return;
    }

    if (profileData.income.length === 0 && profileData.expenses.length === 0 && profileData.payments.length === 0) {
        setInsight('');
        setError(t('ai.noDataForInsight'));
        return;
    }

    setIsLoading(true);
    setHasGenerated(true);
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

  const hasData = profileData.income.length > 0 || profileData.expenses.length > 0 || profileData.payments.length > 0 || profileData.oneTimePayments.length > 0;
  
  const renderContent = () => {
    if (!geminiApiKey) {
      return (
        <div className="text-sm text-muted-foreground flex items-center gap-2 p-4 justify-center text-center">
          <KeyRound className="h-4 w-4" />
          <p>{t('ai.promptForApiKey')}</p>
        </div>
      );
    }

    if (isLoading) {
      return <p className="text-sm text-muted-foreground">{t('ai.loading')}</p>;
    }
    
    if (error) {
      return (
        <div className="text-sm text-destructive flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <p>{error}</p>
        </div>
      );
    }
    
    if (insight) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
                p: ({node, ...props}) => <p className="text-sm text-foreground" {...props} />,
            }}
          >{insight}</ReactMarkdown>
        </div>
      );
    }
    
    if (!hasGenerated && hasData) {
       return (
            <div className="text-center py-4 space-y-4">
                <p className="text-sm text-muted-foreground">{t('ai.generateInsightPrompt')}</p>
                <Button onClick={fetchInsight}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    {t('ai.generateButton')}
                </Button>
            </div>
        );
    }

    return <p className="text-sm text-muted-foreground">{t('ai.noData')}</p>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Lightbulb className="h-6 w-6 text-yellow-500" />
        <div>
          <CardTitle className="text-lg">{t('ai.title')}</CardTitle>
          <CardDescription>{t('ai.description')}</CardDescription>
        </div>
        {hasGenerated && (
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
        )}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
