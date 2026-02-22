'use client';

import { generateDescriptionClient } from '@/lib/ai-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Sparkles, Loader2 } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useFirebaseApp } from '@/firebase';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { z } from 'zod';

const itemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
});

type FormErrors = {
    name?: string[];
    location?: string[];
    photo?: string[];
    description?: string[];
};

export default function AddItemForm({ boxId }: { boxId: string }) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FormErrors>({});
  const [formMessage, setFormMessage] = useState('');

  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const router = useRouter();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({...prev, photo: undefined}));
    }
  };

  const handleAiSuggest = async () => {
    if (!imagePreview) {
        toast({
            title: 'No Photo Selected',
            description: 'Please select a photo first to get an AI suggestion.',
            variant: 'destructive'
        })
      return;
    }
    setIsAiLoading(true);
    try {
      const result = await generateDescriptionClient(imagePreview);
      if (result.success) {
        setDescription(result.itemDescription || '');
        if (result.itemName) {
            // This assumes your form has a name field you can set
            const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
            if(nameInput) nameInput.value = result.itemName;
        }
      } else {
        toast({ title: 'AI Suggestion Failed', description: result.message, variant: 'destructive'});
      }
    } catch (error) {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive'});
    } finally {
      setIsAiLoading(false);
    }
  };
  
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});
    setFormMessage('');

    if (!user || !firestore || !firebaseApp) {
        setFormMessage('Error: Authentication or Firebase services are not available.');
        return;
    }

    if (!imageFile) {
        setErrors({ photo: ['Photo is required'] });
        return;
    }

    const formData = new FormData(event.currentTarget);
    const validatedFields = itemSchema.safeParse({
        name: formData.get('name'),
        location: formData.get('location'),
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        setErrors(validatedFields.error.flatten().fieldErrors);
        return;
    }

    startTransition(async () => {
        try {
            const storage = getStorage(firebaseApp);
            // 1. Upload image to Firebase Storage
            const storageRef = ref(storage, `items/${user.uid}/${Date.now()}-${imageFile.name}`);
            const snapshot = await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(snapshot.ref);

            // Parse tags
            const tagsRaw = (formData.get('tags') as string) || '';
            const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

            // 2. Save item data to Firestore
            await addDoc(collection(firestore, 'items'), {
                name: validatedFields.data.name,
                location: validatedFields.data.location,
                description: validatedFields.data.description || '',
                boxId,
                imageUrl,
                userId: user.uid,
                createdAt: Timestamp.now(),
                tags,
            });
            
            // No revalidatePath or redirect in client components. Use router.
            router.push(`/box?id=${boxId}`);

        } catch (error) {
            console.error(error);
            setFormMessage('Error: Could not add item. Please try again.');
        }
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="photo">Photo</Label>
            <div className="w-full aspect-video rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden">
              {imagePreview ? (
                <Image src={imagePreview} alt="Item preview" width={400} height={300} className="object-cover h-full w-full" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Camera className="mx-auto h-12 w-12" />
                  <p>Take a picture</p>
                </div>
              )}
            </div>
            <Input
              id="photo"
              name="photo"
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
              <Camera className="mr-2 h-4 w-4" />
              {imagePreview ? 'Change Photo' : 'Take Photo'}
            </Button>
            {errors?.photo && <p className="text-sm font-medium text-destructive">{errors.photo[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" name="name" placeholder="e.g., Winter Jacket" required />
            {errors?.name && <p className="text-sm font-medium text-destructive">{errors.name[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <div className="relative">
              <Textarea
                id="description"
                name="description"
                placeholder="e.g., Blue, size L, barely used"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleAiSuggest}
                disabled={!imagePreview || isAiLoading}
                className="absolute bottom-2 right-2"
              >
                {isAiLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                Suggest
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="location">Box Location</Label>
            <Input id="location" name="location" placeholder="e.g., Garage Shelf A" required />
            {errors?.location && <p className="text-sm font-medium text-destructive">{errors.location[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input id="tags" name="tags" placeholder="e.g., electronics, fragile, winter" />
            <p className="text-xs text-muted-foreground">Comma-separated tags for easier filtering</p>
          </div>

          <input type="hidden" name="boxId" value={boxId} />
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Item
          </Button>
        </CardFooter>
      </Card>
      {formMessage && (
        <p className="mt-4 text-sm font-medium text-destructive">{formMessage}</p>
      )}
    </form>
  );
}
