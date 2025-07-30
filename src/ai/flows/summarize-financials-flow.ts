'use server';
/**
 * @fileOverview A financial summarization AI agent.
 *
 * - summarizeFinancials - A function that handles the financial summarization process.
 * - FinancialSummaryInput - The input type for the summarizeFinancials function.
 * - FinancialSummaryOutput - The return type for the summarizeFinancials function.
 */

import { ai } from '@/ai/genkit';
import type { ProfileData } from '@/types/fintrack';
import { z } from 'zod';
import {
  incomeSchema,
  oneTimeIncomeSchema,
  expenseSchema,
  recurringPaymentSchema,
  oneTimePaymentSchema,
  savingsGoalSchema,
  savingsAccountSchema
} from '@/types/fintrack.zod';
import { format } from 'date-fns';

const FinancialSummaryInputSchema = z.object({
  income: z.array(incomeSchema),
  oneTimeIncomes: z.array(oneTimeIncomeSchema),
  expenses: z.array(expenseSchema),
  payments: z.array(recurringPaymentSchema),
  oneTimePayments: z.array(oneTimePaymentSchema),
  currentBalance: z.number(),
  savingsGoals: z.array(savingsGoalSchema),
  savingsAccounts: z.array(savingsAccountSchema),
});

const FinancialSummaryOutputSchema = z.object({
  summary: z.string().describe("A concise but insightful summary of the user's financial situation, formatted in Markdown."),
});

export type FinancialSummaryInput = z.infer<typeof FinancialSummaryInputSchema>;
export type FinancialSummaryOutput = z.infer<typeof FinancialSummaryOutputSchema>;

export async function summarizeFinancials(input: ProfileData): Promise<FinancialSummaryOutput> {
  const validatedInput = FinancialSummaryInputSchema.parse(input);
  return summarizeFinancialsFlow(validatedInput);
}

const prompt = ai.definePrompt({
  name: 'summarizeFinancialsPrompt',
  input: { schema: FinancialSummaryInputSchema },
  output: { schema: FinancialSummaryOutputSchema },
  prompt: `
    You are an expert financial advisor. Your task is to provide a concise, insightful, and actionable summary of the user's financial situation based on the data provided. Today's date is ${format(new Date(), 'yyyy-MM-dd')}.

    Your response must be structured in Markdown and follow these sections:
    ### 📈 Financial Health Overview
    Provide a brief, one or two-sentence analysis of the overall financial picture. Mention the net monthly savings and whether it's positive or negative.

    ### 👍 What's Going Well
    - Identify and list 1-2 positive aspects. This could be a strong savings rate, low debt, or diversified income.

    ### ⚠️ Areas for Improvement
    - Identify and list 1-2 key areas that need attention. This could be high spending in a certain category, low savings, or significant upcoming one-time payments.

    ### 💡 Actionable Recommendations
    - Provide 1-2 clear, simple, and actionable recommendations based on the areas for improvement.

    Here is the user's financial data:
    \`\`\`json
    {{{json input}}}
    \`\`\`
  `,
});


const summarizeFinancialsFlow = ai.defineFlow(
  {
    name: 'summarizeFinancialsFlow',
    inputSchema: FinancialSummaryInputSchema,
    outputSchema: FinancialSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
