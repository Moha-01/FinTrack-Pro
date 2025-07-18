'use server';
/**
 * @fileOverview Ein KI-Agent zur Analyse von Finanzdaten, der intelligente Einblicke und Empfehlungen gibt.
 *
 * - summarizeFinancialData - Eine Funktion, die den Prozess der Finanzanalyse übernimmt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { FinancialDataSummaryInput, FinancialDataSummaryInputSchema, FinancialDataSummaryOutput, FinancialDataSummaryOutputSchema } from '@/types/ai';

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
