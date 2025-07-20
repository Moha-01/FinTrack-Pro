/**
 * @fileOverview A smart financial insight AI agent.
 *
 * - generateInsights - A function that handles the financial analysis process.
 * - GenerateInsightsInput - The input type for the generateInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { ProfileData } from '@/types/fintrack';

export type GenerateInsightsInput = ProfileData & { language: 'en' | 'de' };

export async function generateInsights(input: GenerateInsightsInput): Promise<string> {
  const { language, ...financialData } = input;
  
  const insightPrompt = ai.definePrompt({
    name: 'insightPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.any() }, 
    output: { format: 'text' },
    prompt: `You are an expert financial advisor. Your response MUST be in the language with the ISO 639-1 code: ${language}.

    Analyze the user's financial data provided below.
    The data includes monthly income, monthly expenses, recurring payments, one-time payments, and current balance.

    Based on this data, provide a concise summary of their financial health and generate a list of 3-5 actionable recommendations.
    The recommendations should be practical and tailored to the provided data. For example, if expenses are high, suggest specific areas for savings. If there is a good net saving, suggest investment or saving strategies.

    Format your response using Markdown for clarity. Use headings, bullet points, and bold text to structure your insights. Do not wrap your response in a JSON object.

    User's Financial Data:
    Current Balance: {{{currentBalance}}}
    
    Income:
    {{#each income}}
    - Source: {{source}}, Amount: {{amount}}, Recurrence: {{recurrence}}
    {{else}}
    No income data provided.
    {{/each}}

    Expenses:
    {{#each expenses}}
    - Category: {{category}}, Amount: {{amount}}, Recurrence: {{recurrence}}
    {{else}}
    No expense data provided.
    {{/each}}

    Recurring Payments:
    {{#each payments}}
    - Name: {{name}}, Amount: {{amount}}, Ends: {{completionDate}}
    {{else}}
    No recurring payment data provided.
    {{/each}}
    
    One-Time Payments:
    {{#each oneTimePayments}}
    - Name: {{name}}, Amount: {{amount}}, Due: {{dueDate}}
    {{else}}
    No one-time payment data provided.
    {{/each}}
    `,
  });

  const { output } = await insightPrompt(financialData);
  if (!output) {
    throw new Error('AI failed to generate insights.');
  }
  
  return output;
}
