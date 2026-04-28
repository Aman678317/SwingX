'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Score {
  id: string;
  score: number;
  score_date: string;
  created_at: string;
}

export default function ScoresPage() {
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [scoreInput, setScoreInput] = useState<number | ''>('');
  const [dateInput, setDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const res = await fetch('/api/scores');
      if (!res.ok) throw new Error('Failed to fetch scores');
      const data = await res.json();
      setScores(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = { score: Number(scoreInput), score_date: dateInput };

    try {
      if (isEditing) {
        const res = await fetch(`/api/scores/${isEditing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.status === 409) throw new Error('Score for this date already exists');
        if (!res.ok) throw new Error('Failed to update score');
        
        await fetchScores();
        setIsEditing(null);
      } else {
        const res = await fetch('/api/scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        if (res.status === 409) throw new Error('Score for this date already exists');
        if (!res.ok) {
           const errData = await res.json();
           throw new Error(errData.error || 'Failed to add score');
        }
        
        const data = await res.json();
        setScores(data); // Returns the updated list
      }
      
      // Reset form
      setScoreInput('');
      setDateInput(new Date().toISOString().split('T')[0]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this score?')) return;
    
    try {
      const res = await fetch(`/api/scores/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete score');
      
      setScores(scores.filter(s => s.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const startEdit = (score: Score) => {
    setIsEditing(score.id);
    setScoreInput(score.score);
    setDateInput(score.score_date);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) return <div className="p-8 text-center">Loading scores...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Scores</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your latest 5 Stableford scores for the upcoming draw.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg dark:bg-red-900/20">
          {error}
        </div>
      )}

      {/* Score Entry Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Score' : 'Add New Score'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Score (1-45)</label>
            <input
              type="number"
              min="1"
              max="45"
              required
              value={scoreInput}
              onChange={(e) => setScoreInput(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium mb-1">Date Played</label>
            <input
              type="date"
              required
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <button
              type="submit"
              disabled={submitting}
              className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              {submitting ? 'Saving...' : isEditing ? 'Update' : 'Save'}
            </button>
            {isEditing && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(null);
                  setScoreInput('');
                }}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Scores List */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Latest Scores</h2>
        {scores.length === 0 ? (
          <p className="text-gray-500">No scores recorded yet. Add your first score above!</p>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {scores.map((score, index) => (
                <motion.div
                  key={score.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 shadow-sm flex justify-between items-center"
                >
                  <div>
                    <div className="text-2xl font-bold text-indigo-600">{score.score} pts</div>
                    <div className="text-sm text-gray-500">{new Date(score.score_date).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(score)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(score.id)}
                      className="px-3 py-1 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded dark:bg-red-900/20 dark:hover:bg-red-900/40"
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
