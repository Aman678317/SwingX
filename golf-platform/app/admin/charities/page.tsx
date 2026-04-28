'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [eventsJson, setEventsJson] = useState('[]');

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchCharities();
  }, []);

  const fetchCharities = async () => {
    try {
      const { data, error } = await supabase
        .from('charities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setCharities(data || []);
    } catch (error) {
      console.error('Error fetching charities', error);
    } finally {
      setLoading(false);
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setImageUrl('');
    setIsFeatured(false);
    setEventsJson('[]');
    setIsModalOpen(true);
  };

  const openEditModal = (charity: any) => {
    setEditingId(charity.id);
    setName(charity.name);
    setDescription(charity.description || '');
    setImageUrl(charity.image_url || '');
    setIsFeatured(charity.is_featured);
    setEventsJson(JSON.stringify(charity.upcoming_events || [], null, 2));
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this charity?')) return;
    try {
      const res = await fetch(`/api/charities/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCharities(charities.filter(c => c.id !== id));
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let upcoming_events = [];
    try {
      upcoming_events = JSON.parse(eventsJson);
    } catch (err) {
      alert('Invalid JSON for upcoming events');
      return;
    }

    const payload = { name, description, image_url: imageUrl, is_featured: isFeatured, upcoming_events };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/charities/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/charities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) throw new Error('Failed to save charity');
      
      setIsModalOpen(false);
      await fetchCharities();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Charities</h1>
        <button 
          onClick={openNewModal}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 transition"
        >
          + Add Charity
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
                <th className="p-4">Name</th>
                <th className="p-4">Featured</th>
                <th className="p-4">Events</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {charities.map(charity => (
                <tr key={charity.id} className="border-b dark:border-gray-700">
                  <td className="p-4 font-medium">{charity.name}</td>
                  <td className="p-4">
                    {charity.is_featured ? (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-bold">Featured</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-500">
                    {charity.upcoming_events?.length || 0} event(s)
                  </td>
                  <td className="p-4 text-right space-x-3">
                    <button onClick={() => openEditModal(charity)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Edit</button>
                    <button onClick={() => handleDelete(charity.id)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Charity' : 'New Charity'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input required value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} className="w-full p-2 border rounded dark:bg-gray-700 dark:border-gray-600" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="feat" checked={isFeatured} onChange={e=>setIsFeatured(e.target.checked)} className="w-4 h-4" />
                <label htmlFor="feat" className="font-medium">Mark as Featured</label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upcoming Events (JSON array)</label>
                <textarea 
                  rows={4} 
                  value={eventsJson} 
                  onChange={e=>setEventsJson(e.target.value)} 
                  className="w-full p-2 border rounded font-mono text-sm dark:bg-gray-700 dark:border-gray-600" 
                  placeholder={`[{"event_name": "Gala", "date": "2024-12-01", "location": "Dublin"}]`}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
