'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

export default function TrackPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['track', token],
    queryFn: async () => {
      const { data } = await api.get(`/tracking/${token}`);
      return data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading job card...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Tracking Link Invalid</h1>
          <p className="text-gray-500">This tracking link is invalid or has expired. Please contact the workshop for an updated link.</p>
        </div>
      </div>
    );
  }

  const { jobCard, milestones, media } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Ikram Automotive</h1>
          <p className="text-gray-500">Job Card Progress Tracker</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {jobCard.make} {jobCard.model} {jobCard.year ? `(${jobCard.year})` : ''}
              </h2>
              <p className="text-gray-500">{jobCard.plate_number || jobCard.vin || 'No plate'}</p>
            </div>
            <StatusBadge status={jobCard.status} />
          </div>
          {jobCard.description && (
            <p className="text-gray-600 border-t border-gray-100 pt-4">{jobCard.description}</p>
          )}
        </section>

        {milestones?.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customization Milestones</h3>
            <div className="space-y-4">
              {milestones.map((milestone: any) => (
                <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MilestoneIcon status={milestone.status} />
                      <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      milestone.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      milestone.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      milestone.status === 'SKIPPED' ? 'bg-gray-100 text-gray-500' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {milestone.status.replace('_', ' ')}
                    </span>
                  </div>
                  {milestone.description && (
                    <p className="text-sm text-gray-500 mb-3">{milestone.description}</p>
                  )}
                  {milestone.tasks?.length > 0 && (
                    <div className="ml-6 space-y-1.5">
                      {milestone.tasks.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${
                            task.status === 'COMPLETED' ? 'bg-green-500 text-white' :
                            task.status === 'SKIPPED' ? 'bg-gray-300' :
                            'border-2 border-gray-300'
                          }`}>
                            {task.status === 'COMPLETED' && '✓'}
                          </span>
                          <span className={task.status === 'COMPLETED' ? 'text-gray-600' : 'text-gray-700'}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {media?.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Media Gallery</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {media.map((item: any) => (
                <a
                  key={item.id}
                  href={item.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
                >
                  <img
                    src={item.thumbUrl || item.fileUrl}
                    alt={item.original_name}
                    className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                    <span className="text-xs text-white truncate block">{item.original_name}</span>
                  </div>
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="text-center text-sm text-gray-400 pb-8">
          Powered by Ikram Automotive Workshop Management System
        </footer>
      </main>
    </div>
  );
}

function MilestoneIcon({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    COMPLETED: 'text-green-500',
    IN_PROGRESS: 'text-blue-500',
    SKIPPED: 'text-gray-300',
    PENDING: 'text-yellow-400',
  };
  return (
    <svg className={`w-5 h-5 ${colorMap[status] || 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" />
    </svg>
  );
}