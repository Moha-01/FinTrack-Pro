
'use server';
/**
 * @fileOverview A smart financial insight AI agent.
 *
 * - generateInsights - A function that handles the financial analysis process.
 * - GenerateInsightsInput - The input type for the generateInsights function.
 * - GenerateInsightsOutput - The return type for the generateInsights function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { ProfileData } from '@/types/fintrack';

export type GenerateInsightsInput = ProfileData & { language: 'en' | 'de' };

const GenerateInsightsOutputSchema = z.object({
  summary: z.string().describe("A brief, one or two sentence summary of the user's financial situation."),
  recommendations: z.array(z.object({
    title: z.string().describe("A short, catchy title for the recommendation."),
    description: z.string().describe("A detailed description of the recommendation and why it's important."),
  })).describe("A list of actionable financial recommendations.")
});

export type GenerateInsightsOutput = z.infer<typeof GenerateInsightsOutputSchema>;

export async function generateInsights(input: GenerateInsightsInput): Promise<GenerateInsightsOutput> {
  const { language, ...financialData } = input;
  
  const insightPrompt = ai.definePrompt({
    name: 'insightPrompt',
    model: 'googleai/gemini-1.5-flash-latest',
    input: { schema: z.any() }, // Using any for simplicity with ProfileData
    output: { schema: GenerateInsightsOutputSchema },
    prompt: `You are an expert financial advisor. Your response MUST be in the language with the ISO 639-1 code: ${language}.

    Analyze the user's financial data provided below.
    The data includes monthly income, monthly expenses, recurring payments, one-time payments, and current balance.

    Based on this data, provide a concise summary of their financial health and generate a list of 3-5 actionable recommendations.
    The recommendations should be practical and tailored to the provided data. For example, if expenses are high, suggest specific areas for savings. If there is a good net saving, suggest investment or saving strategies.

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

    Your entire response must be a single JSON object. The JSON object must contain two keys: "summary" and "recommendations". The summary must be a brief, one or two sentence overview. The recommendations must be an array of objects.

    Example of the required output format:
    {
      "summary": "Your financial situation shows a positive monthly saving, but high expenses in the 'transport' category.",
      "recommendations": [
        { "title": "Review Transport Costs", "description": "Consider using public transport or carpooling to reduce fuel and maintenance costs." },
        { "title": "Increase Savings", "description": "With your positive net savings, consider opening a high-yield savings account." }
      ]
    }
    `,
  });

  let attempts = 0;
  while (attempts < 3) {
    try {
      const { output } = await insightPrompt(financialData);
      if (!output) {
        throw new Error('AI returned an empty output.');
      }
      // The schema validation is now part of the definePrompt, so if it passes, we can return.
      return output;
    } catch (error) {
      attempts++;
      console.warn(`Attempt ${attempts} failed to generate insights:`, error);
      if (attempts >= 3) {
        throw new Error('AI failed to generate valid insights after multiple attempts.');
      }
    }
  }

  // This should not be reachable, but as a fallback
  throw new Error('AI failed to generate insights.');
}
