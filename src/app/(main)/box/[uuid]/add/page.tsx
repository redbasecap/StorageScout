import AddItemForm from '@/components/add-item-form';

export default async function AddItemPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
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
