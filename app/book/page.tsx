'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PublicBookPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [title, setTitle] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [notes, setNotes] = useState('');
  const [done, setDone] = useState(false);

  const { data: workshops } = useQuery({
    queryKey: ['public-workshops'],
    queryFn: async () => {
      const { data } = await api.get('/workshops/public');
      return data.workshops;
    },
  });

  const [selectedWorkshop, setSelectedWorkshop] = useState('');

  useEffect(() => {
    if (workshops?.length === 1) {
      setSelectedWorkshop(workshops[0].id);
    }
  }, [workshops]);

  const { data: slots } = useQuery({
    queryKey: ['public-slots', scheduledDate, selectedWorkshop],
    queryFn: async () => {
      if (!selectedWorkshop) return [];
      const { data } = await api.get(`/appointments/public-slots?date=${scheduledDate}&workshopId=${selectedWorkshop}`);
      return data.slots;
    },
    enabled: !!selectedWorkshop,
  });

  const bookAppt = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/appointments/public-book', payload);
      return data;
    },
    onSuccess: () => {
      setDone(true);
      toast.success('Appointment booked! We\'ll confirm shortly.');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to book'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkshop) { toast.error('Please select a workshop.'); return; }
    bookAppt.mutate({
      name, phone, email: email || undefined,
      make, model, year: year ? parseInt(year) : undefined, plateNumber: plateNumber || undefined,
      workshopId: selectedWorkshop, title, scheduledDate, startTime, endTime, notes: notes || undefined,
    });
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-500 mb-6">We will review your appointment and confirm shortly.</p>
          <Link href="/" className="text-primary-600 hover:text-primary-700 font-medium">Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900">Ikram Automotive</Link>
          <Link href="/login" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Staff Login</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Book a Service</h1>
        <p className="text-gray-500 mb-6">Fill in your details and we&apos;ll get back to you.</p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Contact Info</h2>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required placeholder="+251 91 234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="you@example.com" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Vehicle Info</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make *</label>
                <input value={make} onChange={(e) => setMake(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required placeholder="e.g. Toyota" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input value={model} onChange={(e) => setModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required placeholder="e.g. Corolla" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. 2020" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
              <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" placeholder="e.g. AA-1234-AB" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Appointment Details</h2>

            {workshops && workshops.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Workshop *</label>
                <select value={selectedWorkshop} onChange={(e) => setSelectedWorkshop(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required>
                  <option value="">Select workshop...</option>
                  {workshops.map((w: any) => (
                    <option key={w.id} value={w.id}>{w.name} — {w.address}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Needed *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required placeholder="e.g. Oil change, brake inspection..." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Date *</label>
              <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
              </div>
            </div>

            {slots && slots.filter((s: any) => s.available).length > 0 && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Available slots</label>
                <div className="flex flex-wrap gap-1.5">
                  {slots.filter((s: any) => s.available).map((s: any, i: number) => (
                    <button key={i} type="button" onClick={() => { setStartTime(s.start); setEndTime(s.end); }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" rows={2} placeholder="Any specific issues..." />
            </div>
          </div>

          <button type="submit" disabled={bookAppt.isPending}
            className="w-full bg-primary-600 text-white py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 text-base"
          >
            {bookAppt.isPending ? 'Booking...' : 'Book Appointment'}
          </button>
        </form>
      </main>
    </div>
  );
}
