'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function BookAppointmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Customer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const [title, setTitle] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');

  const { data: vehicles } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles/mine');
      return data.vehicles;
    },
    enabled: !!user && user.role === 'Customer',
  });

  const { data: slots } = useQuery({
    queryKey: ['customer-slots', scheduledDate],
    queryFn: async () => {
      const { data } = await api.get(`/appointments/slots?date=${scheduledDate}`);
      return data.slots;
    },
    enabled: !!user,
  });

  const bookAppt = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/appointments/book', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Appointment booked! We\'ll confirm shortly.');
      router.push('/portal');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to book'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !vehicleId || !scheduledDate || !startTime || !endTime) {
      toast.error('All fields required.');
      return;
    }
    bookAppt.mutate({ title, vehicleId, scheduledDate, startTime, endTime, notes: notes || undefined });
  };

  if (loading) return null;
  if (!user || user.role !== 'Customer') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="w-full lg:ml-64 px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/portal')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to Portal
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Book an Appointment</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Oil change, brake inspection, general service..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
            {vehicles?.length === 0 ? (
              <p className="text-sm text-gray-400">No vehicles registered. Contact the workshop to add your vehicle.</p>
            ) : (
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                required
              >
                <option value="">Select your vehicle...</option>
                {vehicles?.map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.make} {v.model} {v.year ? `(${v.year})` : ''} — {v.plate_number || v.chassis_number || '—'}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          {slots && slots.length > 0 && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Available slots on this date</label>
              <div className="flex flex-wrap gap-1.5">
                {slots.filter((s: any) => s.available).map((s: any, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setStartTime(s.start); setEndTime(s.end); }}
                    className={`text-xs px-2.5 py-1.5 rounded-full border ${
                      startTime === s.start ? 'bg-primary-100 border-primary-300 text-primary-700' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {s.start} — {s.end}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any specific issues or requests..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              rows={2}
            />
          </div>

          <button
            type="submit"
            disabled={bookAppt.isPending || !vehicleId}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            {bookAppt.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </main>
    </div>
  );
}