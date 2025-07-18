"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Lightbulb } from "lucide-react";
import React from "react";

interface SmartInsightsProps {
  insights: string;
  onGenerate: () => void;
  isLoading: boolean;
}

export function SmartInsights({ insights, onGenerate, isLoading }: SmartInsightsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          Smart Insights
        </CardTitle>
        <CardDescription>AI-powered advice to improve your financial health.</CardDescription>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {insights || "Click the button below to generate personalized financial insights."}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={onGenerate} disabled={isLoading} className="w-full transition-all hover:shadow-md">
          <Sparkles className="mr-2 h-4 w-4" />
          {isLoading ? "Analyzing..." : "Generate Insights"}
        </Button>
      </CardFooter>
    </Card>
  );
}
