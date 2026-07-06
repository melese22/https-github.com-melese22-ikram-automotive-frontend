'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlinePhoto, HiOutlineArrowPath, HiOutlineArrowDownTray } from 'react-icons/hi2';

export default function BeforeAfterPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedJobCard, setSelectedJobCard] = useState<string>('');
  const [beforeImg, setBeforeImg] = useState<string | null>(null);
  const [afterImg, setAfterImg] = useState<string | null>(null);

  const { data: jobCards } = useQuery({
    queryKey: ['job-cards'],
    queryFn: async () => {
      const { data } = await api.get('/job-cards');
      return data.jobCards;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: mediaData } = useQuery({
    queryKey: ['media', selectedJobCard],
    queryFn: async () => {
      const { data } = await api.get(`/media/job-card/${selectedJobCard}`);
      return data.media;
    },
    enabled: !!selectedJobCard,
  });

  const updateTags = useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { data } = await api.patch(`/media/${id}/tags`, { tags });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', selectedJobCard] });
      toast.success('Tags updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update tags'),
  });

  const byTag = (tag: string) =>
    mediaData?.filter((m: any) => m.tags?.includes(tag)) || [];

  const beforeMedia = byTag('before');
  const afterMedia = byTag('after');

  const curations = jobCards
    ?.filter((jc: any) => {
      const cardMedia = mediaData && selectedJobCard === jc.id ? mediaData : [];
      return false;
    })
    ?.slice(0, 0);

  const exportData = () => {
    const rows = [
      ['Job Card', 'Customer', 'Vehicle', 'Before Images', 'After Images', 'Status'],
    ];

    jobCards?.forEach((jc: any) => {
      rows.push([
        jc.id,
        jc.customer_name || '',
        `${jc.make} ${jc.model} ${jc.plate_number || ''}`,
        beforeMedia.length.toString(),
        afterMedia.length.toString(),
        jc.status,
      ]);
    });

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `before-after-curation-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  if (!user || user.role === 'Customer') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="w-full lg:ml-64 px-4 py-8">
          <p className="text-center text-gray-500">You do not have access to this page.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
              <HiOutlinePhoto className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Before vs After Curation</h2>
              <p className="text-sm text-gray-500">Tag images as "before" or "after" to curate comparisons</p>
            </div>
          </div>
          <button
            onClick={exportData}
            className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Job Card</label>
          <select
            value={selectedJobCard}
            onChange={(e) => setSelectedJobCard(e.target.value)}
            className="w-full max-w-md px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none bg-white"
          >
            <option value="">Choose a job card...</option>
            {jobCards?.map((jc: any) => (
              <option key={jc.id} value={jc.id}>
                {jc.make} {jc.model} - {jc.customer_name} ({jc.status})
              </option>
            ))}
          </select>
        </div>

        {selectedJobCard && (
          <div className="grid md:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlinePhoto className="w-5 h-5 text-rose-500" />
                Before Images
              </h3>
              {beforeMedia.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                  <HiOutlinePhoto className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No images tagged as "before"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {beforeMedia.map((item: any) => (
                    <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-rose-200 bg-gray-100">
                      <img src={item.thumbUrl || item.fileUrl} alt={item.original_name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => updateTags.mutate({
                          id: item.id,
                          tags: (item.tags || []).filter((t: string) => t !== 'before'),
                        })}
                        className="absolute top-1 right-1 bg-rose-500 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineArrowPath className="w-5 h-5 text-emerald-500" />
                After Images
              </h3>
              {afterMedia.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-200 rounded-xl">
                  <HiOutlineArrowPath className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No images tagged as "after"</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {afterMedia.map((item: any) => (
                    <div key={item.id} className="relative group aspect-square rounded-xl overflow-hidden border-2 border-emerald-200 bg-gray-100">
                      <img src={item.thumbUrl || item.fileUrl} alt={item.original_name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => updateTags.mutate({
                          id: item.id,
                          tags: (item.tags || []).filter((t: string) => t !== 'after'),
                        })}
                        className="absolute top-1 right-1 bg-rose-500 text-white w-6 h-6 rounded-full text-sm flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {mediaData?.length > 0 && (
          <section className="mt-6 bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <HiOutlinePhoto className="w-5 h-5 text-teal-500" />
              All Media — Click to Tag
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {mediaData.map((item: any) => {
                const tags = item.tags || [];
                const isBefore = tags.includes('before');
                const isAfter = tags.includes('after');
                return (
                  <div
                    key={item.id}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                      isBefore ? 'border-red-400 ring-2 ring-red-200 shadow-sm' :
                      isAfter ? 'border-green-400 ring-2 ring-green-200 shadow-sm' :
                      'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                    onClick={() => {
                      let newTags = [...tags];
                      if (isBefore && !isAfter) {
                        newTags = newTags.filter((t: string) => t !== 'before');
                      } else if (!isBefore && !isAfter) {
                        newTags.push('before');
                      } else if (!isBefore && isAfter) {
                        newTags = newTags.filter((t: string) => t !== 'after');
                        newTags.push('before');
                      } else {
                        newTags = newTags.filter((t: string) => t !== 'before');
                      }
                      updateTags.mutate({ id: item.id, tags: newTags });
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      let newTags = [...(item.tags || [])];
                      const isAfter = newTags.includes('after');
                      if (isAfter) {
                        newTags = newTags.filter((t: string) => t !== 'after');
                      } else {
                        newTags = newTags.filter((t: string) => t !== 'before');
                        newTags.push('after');
                      }
                      updateTags.mutate({ id: item.id, tags: newTags });
                    }}
                  >
                    <img src={item.thumbUrl || item.fileUrl} alt={item.original_name} className="w-full h-full object-cover" />
                    {isBefore && (
                      <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider shadow-sm">
                        BEFORE
                      </div>
                    )}
                    {isAfter && (
                      <div className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wider shadow-sm">
                        AFTER
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1.5">
                      <span className="text-[10px] text-white truncate block font-medium">{item.original_name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-red-400" /> Left-click: toggle BEFORE
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 ml-2" /> Right-click: toggle AFTER
            </p>
          </section>
        )}

        {selectedJobCard && (!mediaData || mediaData.length === 0) && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm">
            <HiOutlinePhoto className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 text-sm">No media uploaded for this job card yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}