'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { HiOutlineCalendarDays, HiOutlineArrowLeft, HiOutlineUser, HiOutlineTruck, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock } from 'react-icons/hi2';

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30">
        <Navbar />
        <div className="w-full lg:ml-64 px-4 py-8 text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30">
        <Navbar />
        <div className="w-full lg:ml-64 px-4 py-8 text-center text-gray-500">Appointment not found.</div>
      </div>
    );
  }

  const appt = data;
  const canManage = user?.role === 'SuperAdmin' || user?.role === 'WorkshopManager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/appointments')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back to Appointments
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <HiOutlineCalendarDays className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{appt.title}</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
              <HiOutlineCalendarDays className="w-3.5 h-3.5" />
              {new Date(appt.scheduled_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <HiOutlineClock className="w-3.5 h-3.5" />
              {appt.start_time?.slice(0, 5)} — {appt.end_time?.slice(0, 5)}
            </p>
          </div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full shadow-sm ${statusStyles[appt.status] || ''}`}>
            {appt.status.replace('_', ' ')}
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 mb-6 shadow-sm">
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <HiOutlineUser className="w-4 h-4 text-violet-500" />
                Customer
              </h3>
              <p className="text-gray-600">{appt.customer_name}</p>
              <p className="text-gray-500">{appt.customer_phone}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <HiOutlineTruck className="w-4 h-4 text-violet-500" />
                Vehicle
              </h3>
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
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <HiOutlinePencilSquare className="w-4 h-4 text-violet-500" />
              Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              {appt.status === 'scheduled' && (
                <button onClick={() => updateStatus.mutate('confirmed')} className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 shadow-sm transition-all">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Confirm
                </button>
              )}
              {appt.status === 'confirmed' && (
                <button onClick={() => updateStatus.mutate('in_progress')} className="inline-flex items-center gap-1.5 bg-purple-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 shadow-sm transition-all">
                  <HiOutlineClock className="w-4 h-4" />
                  Mark In Progress
                </button>
              )}
              {appt.status === 'in_progress' && (
                <button onClick={() => updateStatus.mutate('completed')} className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 shadow-sm transition-all">
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  Mark Completed
                </button>
              )}
              {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                <>
                  <button onClick={() => updateStatus.mutate('cancelled')} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all">
                    <HiOutlineXCircle className="w-4 h-4" />
                    Cancel Appointment
                  </button>
                  <button onClick={() => updateStatus.mutate('no_show')} className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-100 transition-all">
                    <HiOutlineXCircle className="w-4 h-4" />
                    No Show
                  </button>
                </>
              )}
              {appt.status !== 'completed' && appt.status !== 'cancelled' && appt.status !== 'no_show' && (
                <button onClick={() => deleteAppt.mutate()} className="inline-flex items-center gap-1.5 text-red-500 text-sm px-3 py-2.5 rounded-xl hover:bg-red-50 transition-all">
                  <HiOutlineTrash className="w-4 h-4" />
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