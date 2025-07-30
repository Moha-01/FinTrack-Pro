"use client";

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, AlertTriangle, RefreshCw, KeyRound, Sparkles } from "lucide-react";
import { useSettings } from "@/hooks/use-settings";
import type { ProfileData } from '@/types/fintrack';
import { summarizeFinancials } from '@/ai/flows/summarize-financials-flow';
import ReactMarkdown from 'react-markdown';

interface SmartReportCardProps {
  profileData: ProfileData;
}

export function SmartReportCard({ profileData }: SmartReportCardProps) {
  const { t, geminiApiKey } = useSettings();
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasGenerated, setHasGenerated] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!geminiApiKey) {
      setError(t('ai.apiKeyMissing'));
      return;
    }

    if (profileData.income.length === 0 && profileData.expenses.length === 0 && profileData.payments.length === 0) {
        setReport('');
        setError(t('ai.noDataForInsight'));
        return;
    }

    setIsLoading(true);
    setHasGenerated(true);
    setError('');
    setReport('');

    try {
        const result = await summarizeFinancials(profileData);
        setReport(result.summary);
    } catch(e) {
        console.error("Error getting generative report:", e);
        if (e instanceof Error && (e.message.includes('API key not valid') || e.message.includes('API_KEY_INVALID'))) {
            setError(t('ai.apiKeyInvalid'));
        } else {
            setError(t('ai.apiError'));
        }
    } finally {
        setIsLoading(false);
    }
  }, [geminiApiKey, t, profileData]);

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
    
    if (report) {
      return (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
                p: ({node, ...props}) => <p className="text-sm text-foreground" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-md font-semibold" {...props} />,
                li: ({node, ...props}) => <li className="text-sm" {...props} />,
            }}
          >{report}</ReactMarkdown>
        </div>
      );
    }
    
    if (!hasGenerated && hasData) {
       return (
            <div className="text-center py-4 space-y-4">
                <p className="text-sm text-muted-foreground">{t('ai.generateReportPrompt')}</p>
                <Button onClick={fetchReport}>
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
          <CardTitle className="text-lg">{t('ai.reportTitle')}</CardTitle>
          <CardDescription>{t('ai.reportDescription')}</CardDescription>
        </div>
        {hasGenerated && (
             <Button 
                variant="ghost" 
                size="icon" 
                onClick={fetchReport} 
                disabled={isLoading || !geminiApiKey}
                className="ml-auto"
            >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="sr-only">Refresh report</span>
            </Button>
        )}
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
