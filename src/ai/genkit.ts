import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// In der Produktionsumgebung (z.B. Firebase App Hosting) wird der API-Schlüssel
// aus einem Secret namens 'GOOGLE_API_KEY' gelesen.
// In der Entwicklung wird der Schlüssel aus der .env-Datei (`GOOGLE_API_KEY`) verwendet.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
