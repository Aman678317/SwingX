'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          charities(name),
          scores(id, score, score_date)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: newStatus })
        .eq('id', userId);
        
      if (error) throw error;
      
      // Update local state
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({ ...selectedUser, subscription_status: newStatus });
      }
      setUsers(users.map(u => u.id === userId ? { ...u, subscription_status: newStatus } : u));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleDeleteScore = async (scoreId: string) => {
    if (!confirm('Are you sure you want to delete this score?')) return;
    try {
      const { error } = await supabase.from('scores').delete().eq('id', scoreId);
      if (error) throw error;
      
      // Update local state
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          scores: selectedUser.scores.filter((s: any) => s.id !== scoreId)
        });
      }
    } catch (error) {
      alert('Failed to delete score');
    }
  };

  const openModal = (user: any) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || u.subscription_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border dark:border-gray-700">
        <input 
          type="text" 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        />
        <select 
          value={filterStatus} 
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="cancelled">Cancelled</option>
          <option value="lapsed">Lapsed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Plan</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Renewal Date</th>
                  <th className="p-4">Charity</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-4 font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                    <td className="p-4 capitalize">{user.subscription_plan || 'None'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${user.subscription_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {user.subscription_status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.subscription_renewal_date ? new Date(user.subscription_renewal_date).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                      {user.charities?.name || 'Not Set'}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => openModal(user)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">No users found.</div>
            )}
          </div>
        )}
      </div>

      {/* User Management Modal */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedUser.full_name}</h2>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Subscription Status Editor */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Subscription Status</h3>
                <div className="flex gap-2">
                  <select 
                    value={selectedUser.subscription_status}
                    onChange={(e) => handleUpdateStatus(selectedUser.id, e.target.value)}
                    className="px-3 py-2 border rounded flex-1 dark:bg-gray-800 dark:border-gray-600"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="lapsed">Lapsed</option>
                  </select>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Plan: <span className="font-medium capitalize">{selectedUser.subscription_plan || 'none'}</span> <br/>
                  Stripe Customer: <span className="font-mono text-xs">{selectedUser.stripe_customer_id || 'none'}</span>
                </div>
              </div>

              {/* Golf Scores Editor */}
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3">Recent Golf Scores</h3>
                {(!selectedUser.scores || selectedUser.scores.length === 0) ? (
                  <p className="text-gray-500 text-sm">No scores recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedUser.scores.map((score: any) => (
                      <li key={score.id} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 border dark:border-gray-700 rounded">
                        <div>
                          <span className="font-bold">{score.score} pts</span>
                          <span className="text-gray-500 text-sm ml-3">{new Date(score.score_date).toLocaleDateString()}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteScore(score.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
