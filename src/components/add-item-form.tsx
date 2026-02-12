'use client';

import { useFormState } from 'react-dom';
import { addItemAction, generateDescriptionAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Sparkles, Loader2 } from 'lucide-react';
import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const initialState = {
  message: '',
};

export default function AddItemForm({ boxId }: { boxId: string }) {
  const [formState, formAction] = useFormState(addItemAction, initialState);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();

  const { toast } = useToast();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
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
      const result = await generateDescriptionAction(imagePreview);
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
    startTransition(() => {
        const formData = new FormData(event.currentTarget);
        if (imageFile) {
            formData.set('photo', imageFile);
        }
        formAction(formData);
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
            {formState?.errors?.photo && <p className="text-sm font-medium text-destructive">{formState.errors.photo[0]}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Item Name</Label>
            <Input id="name" name="name" placeholder="e.g., Winter Jacket" required />
            {formState?.errors?.name && <p className="text-sm font-medium text-destructive">{formState.errors.name[0]}</p>}
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
            {formState?.errors?.location && <p className="text-sm font-medium text-destructive">{formState.errors.location[0]}</p>}
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
      {formState.message && !formState.errors && (
        <p className="mt-4 text-sm font-medium text-destructive">{formState.message}</p>
      )}
    </form>
  );
}
