'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import StatusBadge from '@/components/StatusBadge';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function JobCardsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [page, setPage] = useState(1);

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data.vehicles;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const { data: jobCardsData, isLoading } = useQuery({
    queryKey: ['job-cards', page],
    queryFn: async () => {
      const endpoint = user?.role === 'Customer' ? '/job-cards/mine' : `/job-cards?page=${page}&limit=20`;
      const { data } = await api.get(endpoint);
      return data;
    },
  });

  const jobCards = jobCardsData?.jobCards;
  const total = jobCardsData?.total || 0;
  const totalPages = jobCardsData?.totalPages || 0;

  const createMutation = useMutation({
    mutationFn: async (formData: { vehicleId: string; description: string }) => {
      const { data } = await api.post('/job-cards', formData);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      toast.success('Job card created!');
      setShowCreate(false);
      setVehicleId('');
      setDescription('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to create job card');
    },
  });

  const transitionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/job-cards/${id}/status`, { status });
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      toast.success(`Status updated to ${data.jobCard.status}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to update status');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId) return toast.error('Please select a vehicle');
    createMutation.mutate({ vehicleId, description });
  };

  const nextStatus: Record<string, string> = {
    PENDING: 'DIAGNOSTIC',
    DIAGNOSTIC: 'IN_PROGRESS',
    IN_PROGRESS: 'TEST_DRIVE',
    TEST_DRIVE: 'COMPLETED',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Job Cards</h2>
          {user?.role !== 'Customer' && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700"
            >
              {showCreate ? 'Cancel' : '+ New Job Card'}
            </button>
          )}
        </div>

        {showCreate && (
          <form onSubmit={handleCreate} className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Create Job Card</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                >
                  <option value="">Select a vehicle</option>
                  {vehicles?.map((v: any) => (
                    <option key={v.id} value={v.id}>
                      {v.make} {v.model} ({v.plate_number || v.vin || 'No plate'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                  rows={2}
                  placeholder="Describe the work needed..."
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Job Card'}
            </button>
          </form>
        )}

        {isLoading ? (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : jobCards?.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500">No job cards found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mechanic</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {jobCards?.map((card: any) => (
                  <tr
                    key={card.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/job-cards/${card.id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {card.make} {card.model}
                      </div>
                      <div className="text-xs text-gray-500">{card.plate_number || card.vin || ''}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{card.customer_name}</td>
                    <td className="px-6 py-4"><StatusBadge status={card.status} /></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{card.mechanic_name || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {card.status !== 'COMPLETED' && user?.role !== 'Customer' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              transitionMutation.mutate({
                                id: card.id,
                                status: nextStatus[card.status],
                              });
                            }}
                            disabled={transitionMutation.isPending}
                            className="text-primary-600 hover:text-primary-800 text-sm font-medium disabled:opacity-50"
                          >
                            Move to {nextStatus[card.status]}
                          </button>
                        )}
                        <span
                          onClick={(e) => { e.stopPropagation(); router.push(`/job-cards/${card.id}`); }}
                          className="text-gray-400 hover:text-gray-600 text-sm"
                        >
                          Details
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {user?.role !== 'Customer' && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
        )}
      </main>
    </div>
  );
}
