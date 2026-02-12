'use server';

import { suggestPhotoDescription } from '@/ai/flows/ai-photo-description-suggestion';

export async function generateDescriptionAction(photoDataUri: string) {
  try {
    if (!photoDataUri) {
        return { success: false, message: 'No photo provided.' };
    }
    const result = await suggestPhotoDescription({ photoDataUri });
    return { success: true, ...result };
  } catch (error) {
    console.error(error);
    return { success: false, message: 'Failed to generate description.' };
  }
}
