'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import Pagination from '@/components/Pagination';
import { TableSkeleton } from '@/components/Skeleton';
import api from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { HiOutlineBellAlert, HiOutlineEnvelope, HiOutlineDevicePhoneMobile } from 'react-icons/hi2';

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role === 'Customer')) {
      router.push(user ? '/job-cards' : '/login');
    }
  }, [user, loading, router]);

  const [page, setPage] = useState(1);

  const { data: notifData, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: async () => {
      const { data } = await api.get(`/notifications?page=${page}&limit=20`);
      return data;
    },
    enabled: !!user && user.role !== 'Customer',
  });

  const notifications = notifData?.notifications;
  const total = notifData?.total || 0;
  const totalPages = notifData?.totalPages || 0;

  if (loading || !user || user.role === 'Customer') return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-rose-50/30">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
            <HiOutlineBellAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Notification Log</h2>
            <p className="text-sm text-gray-500">History of all SMS and email notifications sent</p>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <TableSkeleton rows={5} cols={6} />
          </div>
        ) : notifications?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <HiOutlineBellAlert className="w-10 h-10 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No notifications sent yet</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/80">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sent</th>
                  <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {notifications?.map((n: any) => (
                  <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm">
                      <span className="font-semibold text-gray-900">{n.make} {n.model}</span>
                      <span className="text-gray-400 ml-1">{n.plate_number || ''}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        n.recipient_type === 'sms' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {n.recipient_type === 'sms' ? <HiOutlineDevicePhoneMobile className="w-3 h-3" /> : <HiOutlineEnvelope className="w-3 h-3" />}
                        {n.recipient_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{n.recipient_address}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        n.status === 'sent' ? 'bg-green-100 text-green-700' :
                        n.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {n.sent_at ? new Date(n.sent_at).toLocaleString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{n.sent_by_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} total={total} limit={20} onPageChange={setPage} />
      </main>
    </div>
  );
}