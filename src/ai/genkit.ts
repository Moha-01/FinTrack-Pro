/**
 * @fileoverview This file initializes the Genkit AI framework and configures the Google AI plugin.
 * It exports a singleton `ai` object that is used throughout the application to define and run AI flows.
 */
import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Initialize Genkit and configure the Google AI plugin.
// The plugin is configured to use the API key from the `GEMINI_API_KEY` environment variable.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Log all telemetry to the console.
  logSinks: ['console'],
  // In a production environment, you may want to configure a different telemetry sink.
});
