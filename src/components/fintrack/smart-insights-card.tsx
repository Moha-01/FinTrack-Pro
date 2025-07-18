
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Loader2 } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { summarizeFinancialData, type FinancialDataSummaryInput } from '@/ai/flows/summarize-financial-data';

interface SmartInsightsCardProps {
  financialData: FinancialDataSummaryInput;
}

export function SmartInsightsCard({ financialData }: SmartInsightsCardProps) {
  const { t } = useSettings();
  const [insights, setInsights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGetInsights = async () => {
    setIsLoading(true);
    setError("");
    setInsights("");
    try {
      const result = await summarizeFinancialData(financialData);
      setInsights(result.summary);
    } catch (err) {
      console.error(err);
      setError(t('smartInsights.error'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const hasData = financialData.income.length > 0 || financialData.expenses.length > 0 || financialData.recurringPayments.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <Lightbulb className="h-6 w-6 text-muted-foreground" />
        <div>
          <CardTitle className="text-lg">{t('smartInsights.title')}</CardTitle>
          <CardDescription>{t('smartInsights.description')}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {insights ? (
           <div className="text-sm text-foreground whitespace-pre-wrap">{insights}</div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center gap-4 p-4">
             <p className="text-sm text-muted-foreground">
                {hasData ? t('smartInsights.prompt') : t('smartInsights.noData')}
             </p>
             <Button onClick={handleGetInsights} disabled={isLoading || !hasData}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('smartInsights.loading')}
                    </>
                ) : t('smartInsights.button')}
             </Button>
             {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
