'use server';
/**
 * @fileOverview An AI flow for forecasting potential income from casino games.
 *
 * - forecastIncome - A function that predicts income based on game duration and casino.
 * - IncomeForecastInput - The input type for the forecastIncome function.
 * - IncomeForecastOutput - The return type for the forecastIncome function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const IncomeForecastInputSchema = z.object({
  duration: z.enum(['1_hour', '2_hours']).describe('The duration of the gaming session.'),
  casino: z.enum(['1xBet', 'MelBet', 'LineBet']).describe('The online casino platform.'),
});
export type IncomeForecastInput = z.infer<typeof IncomeForecastInputSchema>;

export const IncomeForecastOutputSchema = z.object({
  income: z.number().describe('The forecasted income in USDT for the given duration and casino.'),
});
export type IncomeForecastOutput = z.infer<typeof IncomeForecastOutputSchema>;

export async function forecastIncome(input: IncomeForecastInput): Promise<IncomeForecastOutput> {
  return smartIncomeForecasting(input);
}

const forecastingPrompt = ai.definePrompt({
  name: 'incomeForecastPrompt',
  input: { schema: IncomeForecastInputSchema },
  output: { schema: IncomeForecastOutputSchema },
  prompt: `You are an expert financial analyst for online casino gaming. Your task is to predict the potential income in USDT.

Analyze the following factors:
- Gaming Session Duration: {{{duration}}}
- Casino Platform: {{{casino}}}

Based on these factors, provide a realistic but optimistic income forecast. For a 1-hour session, the income should be between 100 and 200 USDT. For a 2-hour session, it should be between 220 and 350 USDT. The specific casino should slightly influence the result within these ranges.
`,
});

const smartIncomeForecasting = ai.defineFlow(
  {
    name: 'smartIncomeForecasting',
    inputSchema: IncomeForecastInputSchema,
    outputSchema: IncomeForecastOutputSchema,
  },
  async (input) => {
    const { output } = await forecastingPrompt(input);
    return output!;
  }
);
