'use server';
/**
 * @fileOverview Ein KI-Agent zur Analyse von Finanzdaten, der intelligente Einblicke und Empfehlungen gibt.
 *
 * - summarizeFinancialData - Eine Funktion, die den Prozess der Finanzanalyse übernimmt.
 * - FinancialDataSummaryInput - Der Eingabetyp für die Funktion summarizeFinancialData.
 * - FinancialDataSummaryOutput - Der Rückgabetyp für die Funktion summarizeFinancialData.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FinancialDataSummaryInputSchema = z.object({
  income: z
    .array(z.object({
      source: z.string().describe('Die Einkommensquelle.'),
      amount: z.number().describe('Der Einkommensbetrag.'),
      recurrence: z.enum(['monthly', 'yearly']).describe('Die Wiederkehr des Einkommens.'),
    }))
    .describe('Die Einkommensdaten des Benutzers.'),
  expenses: z
    .array(z.object({
      category: z.string().describe('Die Ausgabenkategorie.'),
      amount: z.number().describe('Der Ausgabenbetrag.'),
      recurrence: z.enum(['monthly', 'yearly']).describe('Die Wiederkehr der Ausgabe.'),
    }))
    .describe('Die Ausgabendaten des Benutzers.'),
  recurringPayments: z
    .array(z.object({
      name: z.string().describe('Der Name der Zahlung.'),
      amount: z.number().describe('Die Zahlungshöhe.'),
      completionDate: z.string().describe('Das Abschlussdatum der Zahlung.'),
    }))
    .describe('Die wiederkehrenden Zahlungsdaten des Benutzers.'),
});
export type FinancialDataSummaryInput = z.infer<typeof FinancialDataSummaryInputSchema>;

const FinancialDataSummaryOutputSchema = z.object({
  summary: z.string().describe('Eine Zusammenfassung der Finanzdaten des Benutzers mit Einblicken und Empfehlungen.'),
});
export type FinancialDataSummaryOutput = z.infer<typeof FinancialDataSummaryOutputSchema>;

export async function summarizeFinancialData(input: FinancialDataSummaryInput): Promise<FinancialDataSummaryOutput> {
  return financialDataSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'financialDataSummaryPrompt',
  input: {schema: FinancialDataSummaryInputSchema},
  output: {schema: FinancialDataSummaryOutputSchema},
  prompt: `Sie sind ein erfahrener Finanzberater. Analysieren Sie die folgenden Finanzdaten und geben Sie eine Zusammenfassung mit personalisierten, umsetzbaren Einblicken und Empfehlungen zur Verbesserung der finanziellen Gesundheit des Benutzers. Identifizieren Sie Trends, Einsparpotenziale und mögliche Risiken. Strukturieren Sie Ihre Antwort klar und prägnant.

Einkommen:
{{#if income}}
{{#each income}}
- Quelle: {{source}}, Betrag: {{amount}}, Wiederkehr: {{recurrence}}
{{/each}}
{{else}}
Keine Einkommensdaten vorhanden.
{{/if}}

Ausgaben:
{{#if expenses}}
{{#each expenses}}
- Kategorie: {{category}}, Betrag: {{amount}}, Wiederkehr: {{recurrence}}
{{/each}}
{{else}}
Keine Ausgabendaten vorhanden.
{{/if}}

Wiederkehrende Zahlungen:
{{#if recurringPayments}}
{{#each recurringPayments}}
- Name: {{name}}, Betrag: {{amount}}, Abschlussdatum: {{completionDate}}
{{/each}}
{{else}}
Keine wiederkehrenden Zahlungen vorhanden.
{{/if}}

Ihre Aufgabe ist es, basierend auf diesen Daten eine aufschlussreiche Analyse im Feld "summary" zu liefern. Beginnen Sie mit einer kurzen Zusammenfassung der finanziellen Gesamtsituation. Geben Sie dann mindestens zwei konkrete, umsetzbare Empfehlungen.`,
});

const financialDataSummaryFlow = ai.defineFlow(
  {
    name: 'financialDataSummaryFlow',
    inputSchema: FinancialDataSummaryInputSchema,
    outputSchema: FinancialDataSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
