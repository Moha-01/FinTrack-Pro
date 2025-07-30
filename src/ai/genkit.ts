"use server";
/**
 * @fileoverview This file initializes the Genkit AI instance with necessary plugins.
 * It sets up the core AI functionality for the application, ensuring that
 * different models and tools are available for use in AI flows.
 */

import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { firebase } from "@genkit-ai/firebase";

export const ai = genkit({
  plugins: [
    // The Google AI plugin is required for using Gemini models.
    googleAI({
      // We must specify the API key for the plugin to work.
      apiKey: process.env.GEMINI_API_KEY,
    }),
    // The Firebase plugin is used for deploying flows and other resources.
    firebase(),
  ],
  // The log level can be set to 'debug' for more detailed output.
  logLevel: "debug",
  // This option is required to prevent Genkit from trying to read from stdin
  // in a server environment.
  enableTraceStore: false,
});
