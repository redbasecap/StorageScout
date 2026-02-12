'use server';

import { z } from 'zod';
import { auth } from '@/lib/firebase/config';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '@/lib/firebase/config';
import { suggestPhotoDescription } from '@/ai/flows/ai-photo-description-suggestion';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  boxId: z.string(),
  photo: z.instanceof(File),
});

export type FormState = {
  message: string;
  errors?: {
    name?: string[];
    location?: string[];
    photo?: string[];
    description?: string[];
  };
};

export async function addItemAction(prevState: FormState, formData: FormData): Promise<FormState> {
  if (!auth.currentUser) {
    return { message: 'Error: User is not authenticated.' };
  }

  const validatedFields = itemSchema.safeParse({
    name: formData.get('name'),
    location: formData.get('location'),
    description: formData.get('description'),
    boxId: formData.get('boxId'),
    photo: formData.get('photo'),
  });

  if (!validatedFields.success) {
    return {
      message: 'Validation failed. Please check your inputs.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, location, description, boxId, photo } = validatedFields.data;

  try {
    // 1. Upload image to Firebase Storage
    const storageRef = ref(storage, `items/${auth.currentUser.uid}/${Date.now()}-${photo.name}`);
    const snapshot = await uploadBytes(storageRef, photo);
    const imageUrl = await getDownloadURL(snapshot.ref);

    // 2. Save item data to Firestore
    await addDoc(collection(db, 'items'), {
      name,
      location,
      description: description || '',
      boxId,
      imageUrl,
      userId: auth.currentUser.uid,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error(error);
    return { message: 'Error: Could not add item. Please try again.' };
  }
  
  revalidatePath(`/box/${boxId}`);
  redirect(`/box/${boxId}`);
}


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
