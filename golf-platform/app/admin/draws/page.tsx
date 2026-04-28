'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // New draw form
  const [drawMonth, setDrawMonth] = useState('');
  const [drawType, setDrawType] = useState('random');

  // Simulation preview
  const [simulationPreview, setSimulationPreview] = useState<any | null>(null);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      const { data, error } = await supabase
        .from('draws')
        .select('*')
        .order('draw_month', { ascending: false });

      if (error) throw error;
      setDraws(data || []);
    } catch (error) {
      console.error('Error fetching draws:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/draws', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draw_month: drawMonth, draw_type: drawType }),
      });
      if (!res.ok) throw new Error('Failed to create draw');
      
      await fetchDraws();
      setDrawMonth('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulate = async (drawId: string) => {
    setSimulatingId(drawId);
    setSimulationPreview(null);
    try {
      const res = await fetch(`/api/admin/draws/${drawId}/simulate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');
      
      setSimulationPreview({ ...data, drawId });
      await fetchDraws();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSimulatingId(null);
    }
  };

  const handlePublish = async (drawId: string) => {
    if (!confirm('Are you sure? This will finalize the draw and notify winners.')) return;
    try {
      const res = await fetch(`/api/admin/draws/${drawId}/publish`, { method: 'POST' });
      if (!res.ok) throw new Error('Publish failed');
      
      alert('Draw successfully published!');
      setSimulationPreview(null);
      await fetchDraws();
    } catch (error: any) {
      alert(error.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Draw Engine</h1>
      </div>

      {/* Create New Draw */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4">Create New Draw</h2>
        <form onSubmit={handleCreateDraw} className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Draw Month</label>
            <input 
              type="date" 
              required
              value={drawMonth}
              onChange={(e) => setDrawMonth(e.target.value)}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Algorithm</label>
            <select 
              value={drawType}
              onChange={(e) => setDrawType(e.target.value)}
              className="w-full px-4 py-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="random">Pure Random (1-45)</option>
              <option value="algorithmic">Algorithmic (Rarity Weighted)</option>
            </select>
          </div>
          <button 
            type="submit" 
            disabled={submitting || !drawMonth}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Draw Record'}
          </button>
        </form>
      </div>

      {/* Simulation Preview */}
      {simulationPreview && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-bold text-indigo-900 dark:text-indigo-100">Simulation Results</h2>
              <p className="text-indigo-700 dark:text-indigo-300">Preview the outcome before publishing.</p>
            </div>
            <button 
              onClick={() => handlePublish(simulationPreview.drawId)}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 shadow-lg"
            >
              Publish & Notify Winners
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-2">Drawn Numbers</h3>
              <div className="flex gap-2 text-2xl font-bold text-indigo-600">
                {simulationPreview.drawn_numbers?.map((n: number) => (
                  <span key={n} className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-full">{n}</span>
                ))}
              </div>
              {simulationPreview.jackpotRolledOver && (
                <div className="mt-4 p-2 bg-yellow-100 text-yellow-800 rounded text-sm font-bold border border-yellow-200">
                  ⚠️ No 5-Match winners! Jackpot rolls over to next month.
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
              <h3 className="font-semibold mb-4">Prize Distribution</h3>
              <ul className="space-y-3">
                <li className="flex justify-between">
                  <span>5-Match (Jackpot)</span>
                  <div className="text-right">
                    <span className="font-bold">€{simulationPreview.pools['5-match']?.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 ml-2">({simulationPreview.winners['5-match']} winners)</span>
                  </div>
                </li>
                <li className="flex justify-between">
                  <span>4-Match</span>
                  <div className="text-right">
                    <span className="font-bold">€{simulationPreview.pools['4-match']?.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 ml-2">({simulationPreview.winners['4-match']} winners)</span>
                  </div>
                </li>
                <li className="flex justify-between border-b pb-2">
                  <span>3-Match</span>
                  <div className="text-right">
                    <span className="font-bold">€{simulationPreview.pools['3-match']?.toFixed(2)}</span>
                    <span className="text-sm text-gray-500 ml-2">({simulationPreview.winners['3-match']} winners)</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* List Draws */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading draws...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300">
                <th className="p-4">Month</th>
                <th className="p-4">Type</th>
                <th className="p-4">Status</th>
                <th className="p-4">Numbers</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draws.map(draw => (
                <tr key={draw.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-4 font-bold">{new Date(draw.draw_month).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</td>
                  <td className="p-4 capitalize">{draw.draw_type}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase
                      ${draw.status === 'published' ? 'bg-green-100 text-green-800' : 
                        draw.status === 'simulated' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'}`}>
                      {draw.status}
                    </span>
                  </td>
                  <td className="p-4 font-mono">
                    {draw.drawn_numbers ? draw.drawn_numbers.join(', ') : '—'}
                  </td>
                  <td className="p-4 text-right">
                    {draw.status === 'pending' && (
                      <button 
                        onClick={() => handleSimulate(draw.id)}
                        disabled={simulatingId === draw.id}
                        className="px-4 py-2 bg-indigo-100 text-indigo-700 hover:bg-indigo-200 rounded font-medium disabled:opacity-50"
                      >
                        {simulatingId === draw.id ? 'Simulating...' : 'Simulate'}
                      </button>
                    )}
                    {draw.status === 'simulated' && (
                      <button 
                        onClick={() => handlePublish(draw.id)}
                        className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded font-medium"
                      >
                        Publish
                      </button>
                    )}
                    {draw.status === 'published' && (
                      <span className="text-gray-400 italic text-sm">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
