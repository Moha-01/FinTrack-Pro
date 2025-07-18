'use server';

import {genkit, Secret} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Definiert einen geheimen Wert, der in der Produktionsumgebung (z.B. Firebase App Hosting)
// als Secret mit dem Namen 'GOOGLE_API_KEY' bereitgestellt werden muss.
const googleApiKey = new Secret('GOOGLE_API_KEY');

export const ai = genkit({
  plugins: [
    googleAI({
      // In der Entwicklung wird der Schlüssel aus der .env-Datei verwendet.
      // In der Produktion wird der Wert des bereitgestellten Secrets genutzt.
      apiKey: process.env.NODE_ENV === 'production' ? googleApiKey : undefined,
    }),
  ],
  model: 'googleai/gemini-2.0-flash',
});
