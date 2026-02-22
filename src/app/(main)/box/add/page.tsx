'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AddItemForm from '@/components/add-item-form';

function AddItemContent() {
  const searchParams = useSearchParams();
  const uuid = searchParams.get('id') || '';

  if (!uuid) {
    return <div className="container mx-auto p-4">No box ID provided.</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Item</h1>
        <p className="text-muted-foreground">Add a new item to box: {uuid}</p>
      </div>
      <AddItemForm boxId={uuid} />
    </div>
  );
}

export default function AddItemPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-4">Loading...</div>}>
      <AddItemContent />
    </Suspense>
  );
}
