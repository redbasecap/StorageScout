import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Item } from '@/lib/types';
import { MapPin, Box } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type ItemCardProps = {
  item: Item;
};

export default function ItemCard({ item }: ItemCardProps) {
  const placeholderImage = PlaceHolderImages[0];
  
  return (
    <Card className="overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="p-0">
        <div className="aspect-video relative">
          <Image
            src={item.imageUrl || placeholderImage.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint={placeholderImage.imageHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold leading-tight truncate">{item.name}</CardTitle>
        {item.description && (
          <CardDescription className="mt-1 text-sm truncate">{item.description}</CardDescription>
        )}
        <div className="mt-4 flex flex-col space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>{item.location}</span>
            </div>
            <div className="flex items-center">
                <Box className="mr-2 h-4 w-4" />
                <span className="truncate" title={item.boxId}>Box: {item.boxId.substring(0,8)}...</span>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
