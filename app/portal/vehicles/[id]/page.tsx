'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import api from '@/lib/api';
import { useEffect } from 'react';

export default function VehicleHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'Customer')) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-history', id],
    queryFn: async () => {
      const { data } = await api.get(`/vehicles/${id}/history`);
      return data;
    },
    enabled: !!user && !!id && user.role === 'Customer',
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-gray-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'Customer') return null;

  if (!data || !data.vehicle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-gray-500">Vehicle not found.</div>
      </div>
    );
  }

  const { vehicle, history } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/portal/vehicles')}
          className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
        >
          &larr; Back to My Vehicles
        </button>

        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{vehicle.make} {vehicle.model} {vehicle.year ? `(${vehicle.year})` : ''}</h1>
          <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
            {vehicle.plate_number && (
              <div><span className="text-gray-500">Plate:</span> <span className="text-gray-900">{vehicle.plate_number}</span></div>
            )}
            {vehicle.vin && (
              <div><span className="text-gray-500">VIN:</span> <span className="text-gray-900 font-mono text-xs">{vehicle.vin}</span></div>
            )}
            {vehicle.chassis_number && (
              <div><span className="text-gray-500">Chassis:</span> <span className="text-gray-900">{vehicle.chassis_number}</span></div>
            )}
            {vehicle.mileage && (
              <div><span className="text-gray-500">Mileage:</span> <span className="text-gray-900">{vehicle.mileage.toLocaleString()} km</span></div>
            )}
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">Service History ({history?.length || 0} records)</h2>

        {history?.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-gray-200">
            No service records for this vehicle yet.
          </div>
        ) : (
          <div className="space-y-3">
            {history?.map((j: any) => (
              <div key={j.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    j.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                    j.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>{j.status}</span>
                  <span className="text-xs text-gray-400">{new Date(j.created_at).toLocaleDateString()}</span>
                </div>
                {j.description && <p className="text-sm text-gray-600 mb-1">{j.description}</p>}
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{j.mechanic_name ? `Mechanic: ${j.mechanic_name}` : ''}</span>
                  {j.completed_at && <span>Completed: {new Date(j.completed_at).toLocaleDateString()}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}