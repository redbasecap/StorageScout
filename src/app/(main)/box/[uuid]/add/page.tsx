import AddItemForm from '@/components/add-item-form';

export default function AddItemPage({ params }: { params: { uuid: string } }) {
  return (
    <div className="container mx-auto max-w-2xl p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Add New Item</h1>
        <p className="text-muted-foreground">Add a new item to box: {params.uuid}</p>
      </div>
      <AddItemForm boxId={params.uuid} />
    </div>
  );
}
