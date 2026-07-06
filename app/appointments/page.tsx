'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { CardSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCalendarDays, HiOutlinePlusCircle } from 'react-icons/hi2';

const statusStyles: Record<string, string> = {
  scheduled: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-gray-100 text-gray-700',
};

export default function AppointmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data: appointmentsData, isLoading } = useQuery({
    queryKey: ['appointments', date, page],
    queryFn: async () => {
      const { data } = await api.get(`/appointments?date=${date}&page=${page}&limit=20`);
      return data;
    },
    enabled: !!user,
  });

  const data = appointmentsData?.appointments;
  const total = appointmentsData?.total || 0;
  const totalPages = appointmentsData?.totalPages || 0;

  const { data: slots } = useQuery({
    queryKey: ['appointment-slots', date],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/slots?date=${date}`);
      return data.slots;
    },
    enabled: user?.role !== 'Customer',
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data } = await api.patch(`/appointments/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', date] });
      toast.success('Status updated!');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to update'),
  });

  const deleteAppt = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments', date] });
      toast.success('Appointment deleted.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  const canManage = user?.role === 'SuperAdmin' || user?.role === 'WorkshopManager';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <HiOutlineCalendarDays className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
              <p className="text-sm text-gray-500">Schedule and manage service appointments</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setPage(1); }}
              className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            />
            {canManage && (
              <button
                onClick={() => router.push('/appointments/new')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 shadow-sm hover:shadow-md transition-all"
              >
                <HiOutlinePlusCircle className="w-4 h-4" />
                New Appointment
              </button>
            )}
          </div>
        </div>

        {user?.role !== 'Customer' && slots && (
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 mb-6 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <HiOutlineCalendarDays className="w-4 h-4 text-violet-500" />
              Available Slots — {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </h3>
            <div className="flex flex-wrap gap-2">
              {slots.length === 0 ? (
                <span className="text-xs text-gray-400">No available slots (fully booked or past date).</span>
              ) : (
                slots.filter((s: any) => s.available).map((s: any, i: number) => (
                  <span key={i} className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                    {s.start} — {s.end}
                  </span>
                ))
              )}
            </div>
          </div>
        )}

        {isLoading ? (
          <CardSkeleton count={4} />
        ) : !data || data.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineCalendarDays className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No appointments for this date</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((appt: any) => (
              <div key={appt.id} className="bg-white rounded-2xl border border-gray-200/80 p-4 hover:shadow-md transition-all shadow-sm">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-gray-900">{appt.start_time?.slice(0, 5)} — {appt.end_time?.slice(0, 5)}</span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyles[appt.status] || ''}`}>
                        {appt.status.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{appt.title}</h3>
                    <p className="text-sm text-gray-500">
                      {appt.customer_name} &middot; {appt.make} {appt.model} ({appt.plate_number || '—'})
                    </p>
                    {appt.notes && <p className="text-xs text-gray-400 mt-1">{appt.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push(`/appointments/${appt.id}`)}
                      className="text-xs text-violet-600 hover:text-violet-700 font-medium px-2.5 py-1 rounded-lg hover:bg-violet-50 transition-colors"
                    >
                      View
                    </button>
                    {canManage && (
                      <>
                        {appt.status === 'scheduled' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: appt.id, status: 'confirmed' })}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2.5 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                          >
                            Confirm
                          </button>
                        )}
                        {appt.status === 'confirmed' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: appt.id, status: 'in_progress' })}
                            className="text-xs text-purple-600 hover:text-purple-700 font-medium px-2.5 py-1 rounded-lg hover:bg-purple-50 transition-colors"
                          >
                            Start
                          </button>
                        )}
                        {appt.status === 'in_progress' && (
                          <button
                            onClick={() => updateStatus.mutate({ id: appt.id, status: 'completed' })}
                            className="text-xs text-green-600 hover:text-green-700 font-medium px-2.5 py-1 rounded-lg hover:bg-green-50 transition-colors"
                          >
                            Complete
                          </button>
                        )}
                        {(appt.status === 'scheduled' || appt.status === 'confirmed') && (
                          <button
                            onClick={() => deleteAppt.mutate(appt.id)}
                            className="text-xs text-red-400 hover:text-red-600 font-medium px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {data && data.length > 0 && (
          <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
        )}
      </main>
    </div>
  );
}