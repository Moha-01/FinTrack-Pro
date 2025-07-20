
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSettings } from "@/hooks/use-settings";
import { Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { generateInsights } from '@/ai/flows/smart-insight-flow';
import type { ProfileData } from '@/types/fintrack';

interface SmartInsightCardProps {
    profileData: ProfileData;
}

export function SmartInsightCard({ profileData }: SmartInsightCardProps) {
    const { t, language, geminiApiKey, setGeminiApiKey } = useSettings();
    const [localApiKey, setLocalApiKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [insights, setInsights] = useState<string | null>(null);

    const handleSaveKey = () => {
        setGeminiApiKey(localApiKey);
    };

    const handleGenerateInsights = async () => {
        setIsLoading(true);
        setError(null);
        setInsights(null);

        if (!geminiApiKey) {
             setError(t('smartInsight.error'));
             setIsLoading(false);
             return;
        }

        try {
            const result = await generateInsights({ ...profileData, language });
            setInsights(result);
        } catch (err) {
            console.error(err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('API key not valid')) {
                setError(t('smartInsight.apiKeyInvalid'));
            } else {
                setError(t('smartInsight.error'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-yellow-400" />
                    {t('smartInsight.title')}
                </CardTitle>
                <CardDescription>{t('smartInsight.description')}</CardDescription>
            </CardHeader>
            <CardContent>
                {!geminiApiKey ? (
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900/50 dark:bg-yellow-900/20">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-1" />
                            <div>
                                <h3 className="font-semibold text-yellow-800 dark:text-yellow-300">{t('smartInsight.apiKeyRequiredTitle')}</h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-400/80">{t('smartInsight.apiKeyRequiredDescription')}</p>
                            </div>
                        </div>
                        <div className="flex w-full max-w-sm items-center space-x-2">
                            <Input
                                type="text"
                                placeholder={t('smartInsight.apiKeyPlaceholder')}
                                value={localApiKey}
                                onChange={(e) => setLocalApiKey(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                            />
                            <Button onClick={handleSaveKey} disabled={!localApiKey}>{t('common.save')}</Button>
                        </div>
                        <p className="text-xs text-muted-foreground">{t('smartInsight.apiKeyNote')}</p>
                    </div>
                ) : (
                    <div>
                        {isLoading && (
                            <div className="flex flex-col items-center justify-center space-y-2 rounded-lg bg-secondary/50 p-8 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="font-medium">{t('smartInsight.loadingTitle')}</p>
                                <p className="text-sm text-muted-foreground">{t('smartInsight.loadingDescription')}</p>
                            </div>
                        )}
                        {error && !isLoading && (
                             <div className="flex items-start gap-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-destructive">
                                <AlertTriangle className="h-5 w-5 mt-1" />
                                <p>{error}</p>
                            </div>
                        )}
                        {insights && !isLoading && (
                            <div 
                              className="prose prose-sm dark:prose-invert max-w-none text-foreground whitespace-pre-wrap"
                              dangerouslySetInnerHTML={{ __html: insights }}
                            />
                        )}

                        {!isLoading && !insights && (
                             <Button onClick={handleGenerateInsights} className="w-full sm:w-auto">
                                <Lightbulb className="mr-2 h-4 w-4" />
                                {t('smartInsight.generateButton')}
                            </Button>
                        )}
                         {insights && !isLoading && (
                             <Button onClick={handleGenerateInsights} variant="outline" className="mt-4 w-full sm:w-auto">
                                <Lightbulb className="mr-2 h-4 w-4" />
                                {t('smartInsight.regenerateButton')}
                            </Button>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
