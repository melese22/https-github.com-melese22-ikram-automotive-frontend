'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-700',
};

export default function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['appointment', id],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/${id}`);
      return data.appointment;
    },
    enabled: !!user,
  });

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointment', id] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const deleteAppt = useMutation({
    mutationFn: async () => {
      await api.delete(`/appointments/${id}`);
    },
    onSuccess: () => {
      toast.success('Appointment deleted.');
      router.push('/appointments');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8 text-center text-gray-500">Appointment not found.</div>
      </div>
    );
  }

  const appt = data;
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'WorkshopManager';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/appointments')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to Appointments
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{appt.title}</h1>
              <p className="text-sm text-gray-500 mt-1">
                {new Date(appt.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                &middot; {appt.start_time?.slice(0, 5)} — {appt.end_time?.slice(0, 5)}
              </p>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded-full ${statusStyles[appt.status] || ''}`}>
              {appt.status.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-t border-gray-100 pt-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Customer</h3>
              <p className="text-gray-600">{appt.customer_name}</p>
              <p className="text-gray-500">{appt.customer_phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-1">Vehicle</h3>
              <p className="text-gray-600">{appt.make} {appt.model} {appt.year ? `(${appt.year})` : ''}</p>
              <p className="text-gray-500">{appt.plate_number || 'No plate'}</p>
            </div>
          </div>

          {appt.notes && (
            <div className="border-t border-gray-100 pt-4 mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Notes</h3>
              <p className="text-sm text-gray-600">{appt.notes}</p>
            </div>
          )}
        </div>

        {canManage && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
            <div className="flex flex-wrap gap-2">
              {appt.status === 'scheduled' && (
                <button onClick={() => updateStatus.mutate('confirmed')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Confirm
                </button>
              )}
              {appt.status === 'confirmed' && (
                <button onClick={() => updateStatus.mutate('in_progress')} className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700">
                  Mark In Progress
                </button>
              )}
              {appt.status === 'in_progress' && (
                <button onClick={() => updateStatus.mutate('completed')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                  Mark Completed
                </button>
              )}
              {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                <>
                  <button onClick={() => updateStatus.mutate('cancelled')} className="bg-red-100 text-red-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-200">
                    Cancel Appointment
                  </button>
                  <button onClick={() => updateStatus.mutate('no_show')} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                    No Show
                  </button>
                </>
              )}
              {appt.status !== 'completed' && appt.status !== 'cancelled' && appt.status !== 'no_show' && (
                <button onClick={() => deleteAppt.mutate()} className="text-red-500 text-sm underline ml-2">
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}