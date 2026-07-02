'use client';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="bg-gray-200 rounded h-3.5" style={{ width: `${75 - i * 15}%` }} />
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-50 border-b border-gray-200 flex">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="flex-1 px-6 py-3">
            <div className="h-3 bg-gray-300 rounded w-3/4" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex border-b border-gray-100">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="flex-1 px-6 py-4">
              <div className="h-4 bg-gray-200 rounded" style={{ width: `${50 + (c * 10) % 40}%` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex justify-between items-start mb-3">
            <SkeletonBlock className="h-5 w-40" />
            <SkeletonBlock className="h-5 w-20" />
          </div>
          <SkeletonText lines={2} />
          <div className="flex gap-2 mt-3">
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-8 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="animate-pulse bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonBlock className="h-7 w-64" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <SkeletonBlock className="h-6 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <SkeletonBlock className="h-3 w-16 mb-1" />
            <SkeletonBlock className="h-4 w-40" />
          </div>
        ))}
      </div>
      <SkeletonBlock className="h-4 w-full" />
    </div>
  );
}

export function StatCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-lg border border-gray-200 p-4 text-center">
          <SkeletonBlock className="h-8 w-16 mx-auto mb-2" />
          <SkeletonBlock className="h-3 w-20 mx-auto" />
        </div>
      ))}
    </div>
  );
}
