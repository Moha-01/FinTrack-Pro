// financial-insights.ts
'use server';

/**
 * @fileOverview AI-powered financial insights and personalized recommendations flow.
 *
 * - getFinancialInsights - A function that provides financial insights based on user data.
 * - FinancialInsightsInput - The input type for the getFinancialInsights function.
 * - FinancialInsightsOutput - The return type for the getFinancialInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialInsightsInputSchema = z.object({
  income: z.number().describe('Total monthly income.'),
  expenses: z.number().describe('Total monthly expenses.'),
  recurringPayments: z
    .array(
      z.object({
        name: z.string().describe('Name of the recurring payment.'),
        amount: z.number().describe('Amount of the recurring payment.'),
        dueDate: z.string().describe('Due date of the payment (YYYY-MM-DD).'),
        completionDate: z
          .string()
          .describe('Expected completion date of the payment (YYYY-MM-DD).')
          .optional(),
        rate: z.string().describe('The interest rate associated with this payment, like 5%'),
      })
    )
    .describe('Array of recurring payments.'),
});
export type FinancialInsightsInput = z.infer<typeof FinancialInsightsInputSchema>;

const FinancialInsightsOutputSchema = z.object({
  insights: z.string().describe('AI-powered financial insights and recommendations.'),
});
export type FinancialInsightsOutput = z.infer<typeof FinancialInsightsOutputSchema>;

export async function getFinancialInsights(input: FinancialInsightsInput): Promise<FinancialInsightsOutput> {
  return financialInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialInsightsPrompt',
  input: {schema: FinancialInsightsInputSchema},
  output: {schema: FinancialInsightsOutputSchema},
  prompt: `Sie sind ein Finanzberater, der personalisierte Empfehlungen auf Deutsch gibt.

  Basierend auf den folgenden Finanzinformationen, geben Sie Einblicke und Empfehlungen zur Verbesserung der finanziellen Gesundheit. Antworten Sie auf Deutsch.

  Einkommen: {{{income}}}
  Ausgaben: {{{expenses}}}
  Wiederkehrende Zahlungen: {{#each recurringPayments}}- Name: {{{this.name}}}, Betrag: {{{this.amount}}}, Fälligkeitsdatum: {{{this.dueDate}}}, Abschlussdatum: {{{this.completionDate}}}, Rate: {{{this.rate}}} {{/each}}
  `,
});

const financialInsightsFlow = ai.defineFlow(
  {
    name: 'financialInsightsFlow',
    inputSchema: FinancialInsightsInputSchema,
    outputSchema: FinancialInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
