import { Skeleton } from '@/components/ui/skeleton';

export default function ConsumablesLoading() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-9 w-64' />
      <div className='grid gap-4 md:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-16' />
        ))}
      </div>
      <Skeleton className='h-96 w-full' />
    </div>
  );
}
