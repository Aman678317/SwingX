'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminWinnersPage() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending'); // pending, approved, rejected, all

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchVerifications();
  }, []);

  const fetchVerifications = async () => {
    try {
      const res = await fetch('/api/admin/winners');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setVerifications(data.verifications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (v: any) => {
    setSelectedVerification(v);
    setAdminNotes(v.admin_notes || '');
    setIsModalOpen(true);
  };

  const handleUpdate = async (statusUpdate?: string, payoutUpdate?: string) => {
    if (!selectedVerification) return;
    setIsSaving(true);
    
    const payload: any = { admin_notes: adminNotes };
    if (statusUpdate) payload.status = statusUpdate;
    if (payoutUpdate) payload.payout_status = payoutUpdate;

    try {
      const res = await fetch(`/api/admin/winners/${selectedVerification.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Update failed');
      
      await fetchVerifications();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = filter === 'all' 
    ? verifications 
    : verifications.filter(v => v.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Winner Verification</h1>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading verifications...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                <th className="p-4">Draw Month</th>
                <th className="p-4">Tier / Prize</th>
                <th className="p-4">Proof</th>
                <th className="p-4">Verification</th>
                <th className="p-4">Payout</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(v => (
                <tr key={v.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 font-medium">
                    {new Date(v.draw_entries?.draws?.draw_month).toLocaleDateString(undefined, {month:'short', year:'numeric'})}
                  </td>
                  <td className="p-4">
                    <div className="font-bold">{v.draw_entries?.prize_tier}</div>
                    <div className="text-green-600">€{v.draw_entries?.prize_amount}</div>
                  </td>
                  <td className="p-4">
                    {v.proof_url ? (
                      <a href={v.proof_url} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View File</a>
                    ) : (
                      <span className="text-gray-400 italic">Not Uploaded</span>
                    )}
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase
                        ${v.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          v.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {v.status}
                      </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase
                        ${v.payout_status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {v.payout_status}
                      </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => openModal(v)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Review &rarr;</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && selectedVerification && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-6">Review Verification</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2">Draw Information</h3>
                <p><strong>Month:</strong> {new Date(selectedVerification.draw_entries?.draws?.draw_month).toLocaleDateString()}</p>
                <p><strong>Prize Tier:</strong> {selectedVerification.draw_entries?.prize_tier}</p>
                <p><strong>Amount:</strong> €{selectedVerification.draw_entries?.prize_amount}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2">Current Status</h3>
                <p><strong>Verification:</strong> {selectedVerification.status}</p>
                <p><strong>Payout:</strong> {selectedVerification.payout_status}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-gray-500 text-sm uppercase tracking-wider mb-2">Proof Upload</h3>
              {selectedVerification.proof_url ? (
                <div className="border p-2 rounded bg-gray-50 dark:bg-gray-900">
                  {selectedVerification.proof_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                    <img src={selectedVerification.proof_url} alt="Proof" className="max-h-64 mx-auto rounded" />
                  ) : (
                    <a href={selectedVerification.proof_url} target="_blank" rel="noreferrer" className="text-indigo-600 block text-center py-4">
                      Click to view document
                    </a>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 italic">User has not uploaded proof yet.</p>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold mb-2">Admin Notes (internal)</label>
              <textarea 
                rows={3} 
                value={adminNotes} 
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                placeholder="Leave notes about why it was rejected, or payout details..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t dark:border-gray-700">
              <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => handleUpdate('rejected')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 font-bold rounded"
                >
                  Reject
                </button>
                <button 
                  onClick={() => handleUpdate('approved')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 font-bold rounded"
                >
                  Approve Verification
                </button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {selectedVerification.status === 'approved' && selectedVerification.payout_status !== 'paid' && (
                  <button 
                    onClick={() => handleUpdate(undefined, 'paid')}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 font-bold rounded"
                  >
                    Mark as Paid
                  </button>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
