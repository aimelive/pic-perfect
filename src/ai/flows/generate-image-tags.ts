'use server';

/**
 * @fileOverview This file contains the Genkit flow for automatically tagging images with relevant keywords upon upload.
 *
 * - generateImageTags - A function that handles the image tagging process.
 * - GenerateImageTagsInput - The input type for the generateImageTags function.
 * - GenerateImageTagsOutput - The return type for the generateImageTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageTagsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to analyze, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateImageTagsInput = z.infer<typeof GenerateImageTagsInputSchema>;

const GenerateImageTagsOutputSchema = z.object({
  tags: z.array(z.string()).describe('An array of keywords/tags that describe the image.'),
});
export type GenerateImageTagsOutput = z.infer<typeof GenerateImageTagsOutputSchema>;

export async function generateImageTags(input: GenerateImageTagsInput): Promise<GenerateImageTagsOutput> {
  return generateImageTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImageTagsPrompt',
  input: {schema: GenerateImageTagsInputSchema},
  output: {schema: GenerateImageTagsOutputSchema},
  prompt: `You are an expert image analysis tool. Given an image, you will identify objects, scenes, and other relevant details, and generate a list of keywords that can be used to tag the image.

  Image: {{media url=photoDataUri}}
  
  Return a list of keywords suitable for tagging this image, no more than 10 tags.`,
});

const generateImageTagsFlow = ai.defineFlow(
  {
    name: 'generateImageTagsFlow',
    inputSchema: GenerateImageTagsInputSchema,
    outputSchema: GenerateImageTagsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
