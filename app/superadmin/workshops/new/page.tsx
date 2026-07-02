'use client';

import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function NewWorkshopPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SuperAdmin')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const create = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post('/workshops', payload);
      return data;
    },
    onSuccess: () => {
      toast.success('Workshop created!');
      router.push('/superadmin');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to create'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) { toast.error('Workshop name is required.'); return; }
    create.mutate({ name, address: address || undefined, phone: phone || undefined, email: email || undefined });
  };

  if (loading) return null;
  if (!user || user.role !== 'SuperAdmin') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block">
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Workshop</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Workshop Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <button type="submit" disabled={create.isPending}
            className="w-full bg-primary-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
            {create.isPending ? 'Creating...' : 'Create Workshop'}
          </button>
        </form>
      </main>
    </div>
  );
}