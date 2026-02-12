'use server';
/**
 * @fileOverview An AI agent that suggests a name and description for an item based on its photo.
 *
 * - suggestPhotoDescription - A function that handles the photo description suggestion process.
 * - SuggestPhotoDescriptionInput - The input type for the suggestPhotoDescription function.
 * - SuggestPhotoDescriptionOutput - The return type for the suggestPhotoDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestPhotoDescriptionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestPhotoDescriptionInput = z.infer<
  typeof SuggestPhotoDescriptionInputSchema
>;

const SuggestPhotoDescriptionOutputSchema = z.object({
  itemName: z
    .string()
    .describe('A concise name for the item identified in the photo.'),
  itemDescription: z
    .string()
    .describe('A brief, descriptive summary of the item.'),
});
export type SuggestPhotoDescriptionOutput = z.infer<
  typeof SuggestPhotoDescriptionOutputSchema
>;

export async function suggestPhotoDescription(
  input: SuggestPhotoDescriptionInput
): Promise<SuggestPhotoDescriptionOutput> {
  return suggestPhotoDescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestPhotoDescriptionPrompt',
  input: {schema: SuggestPhotoDescriptionInputSchema},
  output: {schema: SuggestPhotoDescriptionOutputSchema},
  prompt: `You are an expert at identifying objects and providing concise names and descriptions.

Analyze the provided image of an item. Based on the visual information, suggest a short, clear name for the item and a brief, descriptive summary of its key characteristics or purpose.

Photo: {{media url=photoDataUri}}`,
});

const suggestPhotoDescriptionFlow = ai.defineFlow(
  {
    name: 'suggestPhotoDescriptionFlow',
    inputSchema: SuggestPhotoDescriptionInputSchema,
    outputSchema: SuggestPhotoDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate description from photo.');
    }
    return output;
  }
);
