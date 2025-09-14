'use server';

/**
 * @fileOverview Simulates user authentication by checking against hardcoded credentials.
 *
 * - simulateAuthentication - A function that simulates the authentication process.
 * - SimulateAuthenticationInput - The input type for the simulateAuthentication function.
 * - SimulateAuthenticationOutput - The return type for the simulateAuthentication function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SimulateAuthenticationInputSchema = z.object({
  email: z.string().describe('The email address entered by the user.'),
  password: z.string().describe('The password entered by the user.'),
});
export type SimulateAuthenticationInput = z.infer<typeof SimulateAuthenticationInputSchema>;

const SimulateAuthenticationOutputSchema = z.object({
  success: z.boolean().describe('Whether the authentication was successful.'),
  message: z.string().describe('A message indicating the result of the authentication.'),
});
export type SimulateAuthenticationOutput = z.infer<typeof SimulateAuthenticationOutputSchema>;

export async function simulateAuthentication(
  input: SimulateAuthenticationInput
): Promise<SimulateAuthenticationOutput> {
  return simulateAuthenticationFlow(input);
}

const simulateAuthenticationFlow = ai.defineFlow(
  {
    name: 'simulateAuthenticationFlow',
    inputSchema: SimulateAuthenticationInputSchema,
    outputSchema: SimulateAuthenticationOutputSchema,
  },
  async input => {
    if (input.email === 'test@example.com' && input.password === 'password123') {
      return {
        success: true,
        message: 'Authentication successful.',
      };
    } else {
      return {
        success: false,
        message: 'Authentication failed. Invalid credentials.',
      };
    }
  }
);
