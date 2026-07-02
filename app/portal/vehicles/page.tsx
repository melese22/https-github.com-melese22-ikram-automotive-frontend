'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useEffect } from 'react';

export default function MyVehiclesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Customer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const { data: vehicles } = useQuery({
    queryKey: ['my-vehicles'],
    queryFn: async () => {
      const { data } = await api.get('/vehicles/mine');
      return data.vehicles;
    },
    enabled: !!user && user.role === 'Customer',
  });

  if (loading) return null;
  if (!user || user.role !== 'Customer') return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/portal')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to Portal
        </button>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Vehicles</h1>

        {vehicles?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No vehicles registered yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {vehicles?.map((v: any) => (
              <div
                key={v.id}
                onClick={() => router.push(`/portal/vehicles/${v.id}`)}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm cursor-pointer transition-shadow"
              >
                <h3 className="font-semibold text-gray-900">{v.make} {v.model} {v.year ? `(${v.year})` : ''}</h3>
                <div className="mt-2 text-sm text-gray-500 space-y-1">
                  {v.plate_number && <p>Plate: {v.plate_number}</p>}
                  {v.vin && <p>VIN: <span className="font-mono text-xs">{v.vin}</span></p>}
                  {v.mileage && <p>Mileage: {v.mileage.toLocaleString()} km</p>}
                </div>
                <div className="mt-3 text-sm text-primary-600 font-medium">
                  View Service History &rarr;
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}