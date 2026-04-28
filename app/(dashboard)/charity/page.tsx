'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface Charity {
  id: string;
  name: string;
}

export default function UserCharityPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharity, setSelectedCharity] = useState<string>('');
  const [contributionPercent, setContributionPercent] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch charities
        const { data: charitiesData, error: charitiesError } = await supabase
          .from('charities')
          .select('id, name')
          .order('name');
          
        if (charitiesError) throw charitiesError;
        setCharities(charitiesData || []);

        // Fetch user profile
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('charity_id, charity_contribution_percent')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) throw profileError;
          
          if (profile) {
            setSelectedCharity(profile.charity_id || '');
            setContributionPercent(profile.charity_contribution_percent || 10);
          }
        }
      } catch (error: any) {
        console.error('Error loading data:', error);
        setMessage({ type: 'error', text: 'Failed to load preferences.' });
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [supabase]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (contributionPercent < 10) {
      setMessage({ type: 'error', text: 'Minimum contribution is 10%.' });
      setSaving(false);
      return;
    }

    if (!selectedCharity) {
      setMessage({ type: 'error', text: 'Please select a charity.' });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/user/charity', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          charity_id: selectedCharity,
          charity_contribution_percent: contributionPercent
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update preferences');
      }

      setMessage({ type: 'success', text: 'Charity preferences updated successfully!' });
      
      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading preferences...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Charity Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage where your contributions go.</p>
      </div>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}
        >
          {message.text}
        </motion.div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
        <form onSubmit={handleSave} className="space-y-8">
          
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-4">
              Selected Charity
            </label>
            <select
              value={selectedCharity}
              onChange={(e) => setSelectedCharity(e.target.value)}
              required
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 appearance-none bg-white dark:bg-gray-800"
            >
              <option value="" disabled>Select a charity to support</option>
              {charities.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-base font-semibold text-gray-900 dark:text-white">
                Contribution Percentage
              </label>
              <span className="text-2xl font-bold text-indigo-600">{contributionPercent}%</span>
            </div>
            
            <input 
              type="range" 
              min="10" 
              max="100" 
              step="5"
              value={contributionPercent} 
              onChange={(e) => setContributionPercent(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
            />
            
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Min 10%</span>
              <span>Max 100%</span>
            </div>
            <p className="text-sm text-gray-500 mt-4 leading-relaxed">
              This percentage of your monthly subscription contribution pool will be allocated to your selected charity. The remainder goes to the main prize draw pool.
            </p>
          </div>

          <div className="pt-4 border-t dark:border-gray-700">
            <button
              type="submit"
              disabled={saving}
              className="w-full md:w-auto px-8 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
