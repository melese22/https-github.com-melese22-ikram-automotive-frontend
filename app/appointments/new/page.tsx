'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCalendarDays, HiOutlineArrowLeft, HiOutlineUser, HiOutlineTruck, HiOutlineClock, HiOutlinePencilSquare } from 'react-icons/hi2';

export default function NewAppointmentPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const { data: customers } = useQuery({
    queryKey: ['users-customers'],
    queryFn: async () => {
      const { data } = await api.get('/auth/users?role=Customer');
      return data.users;
    },
    enabled: !!user,
  });

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles');
      return data.vehicles;
    },
    enabled: !!user,
  });

  const { data: slots } = useQuery({
    queryKey: ['appointment-slots', scheduledDate],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/slots?date=${scheduledDate}`);
      return data.slots;
    },
    enabled: !!user,
  });

  const createAppt = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/appointments', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Appointment created!');
      router.push('/appointments');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !customerId || !vehicleId || !scheduledDate || !startTime || !endTime) {
      toast.error('All fields required.');
      return;
    }
    createAppt.mutate({ title, customerId, vehicleId, scheduledDate, startTime, endTime, notes: notes || undefined });
  };

  const filteredVehicles = vehicles?.filter((v: any) => v.customer_id === customerId) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-violet-50/30">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <HiOutlineArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
            <HiOutlineCalendarDays className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Appointment</h1>
            <p className="text-sm text-gray-500">Schedule a new service appointment</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200/80 p-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Oil change, brake inspection..."
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <HiOutlineUser className="w-4 h-4 text-violet-500" />
              Customer
            </label>
            <select
              value={customerId}
              onChange={(e) => { setCustomerId(e.target.value); setVehicleId(''); }}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              required
            >
              <option value="">Select customer...</option>
              {customers?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name} — {c.phone}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <HiOutlineTruck className="w-4 h-4 text-violet-500" />
              Vehicle
            </label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              required
              disabled={!customerId}
            >
              <option value="">Select vehicle...</option>
              {filteredVehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.make} {v.model} {v.year ? `(${v.year})` : ''} — {v.plate_number || v.chassis_number || '—'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <HiOutlineCalendarDays className="w-4 h-4 text-violet-500" />
              Date
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4 text-violet-500" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4 text-violet-500" />
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
                required
              />
            </div>
          </div>

          {slots && slots.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-2 flex items-center gap-1.5">
                <HiOutlineClock className="w-3.5 h-3.5" />
                Available slots on this date
              </label>
              <div className="flex flex-wrap gap-1.5">
                {slots.filter((s: any) => s.available).map((s: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setStartTime(s.start); setEndTime(s.end); }}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                      startTime === s.start ? 'bg-violet-100 border-violet-300 text-violet-700 shadow-sm' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {s.start} — {s.end}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <HiOutlinePencilSquare className="w-4 h-4 text-violet-500" />
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={createAppt.isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:from-violet-700 hover:to-purple-700 disabled:opacity-50 shadow-sm transition-all"
          >
            {createAppt.isPending ? 'Creating...' : 'Create Appointment'}
          </button>
        </form>
      </main>
    </div>
  );
}