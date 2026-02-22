'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Box } from '@/lib/types';
import { Box as BoxIcon, MapPin, Package } from 'lucide-react';

type BoxCardProps = {
  box: Box;
  label?: string;
};

export default function BoxCard({ box, label }: BoxCardProps) {
  const itemCount = box.items.length;
  const firstItemWithImage = box.items.find(item => item.imageUrl);
  const displayImage = firstItemWithImage ? firstItemWithImage.imageUrl : null;
  
  return (
    <Link href={`/box?id=${box.id}`} className="block h-full">
        <Card className="overflow-hidden transition-all hover:shadow-lg h-full flex flex-col group">
            <CardHeader className="p-0">
                <div className="aspect-video relative bg-muted">
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={`An item from box ${box.id}`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <BoxIcon className="w-16 h-16 text-muted-foreground" />
                    </div>
                )}
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow flex flex-col">
                <div className="flex-grow">
                    <CardTitle className="text-lg font-semibold leading-tight truncate">
                        {label || 'Box'}
                    </CardTitle>
                    <CardDescription className="mt-1 text-sm truncate font-mono" title={box.id}>
                        {box.id.substring(0, 8)}...
                    </CardDescription>
                </div>
                <div className="mt-4 flex flex-col space-y-2 text-sm text-muted-foreground">
                    {box.location && (
                        <div className="flex items-center">
                            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{box.location}</span>
                        </div>
                    )}
                    <div className="flex items-center">
                        <Package className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    </Link>
  );
}
