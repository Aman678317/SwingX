import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface DrawEntry {
  id: string;
  draw_id: string;
  prize_tier: string | null;
  prize_amount: number | null;
  payout_status: string;
  verification?: {
    id: string;
    proof_url: string;
    status: string;
  } | null;
}

export default function WinningsPage() {
  const [entries, setEntries] = useState<DrawEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null); // entry id being uploaded
  const router = useRouter();

  // Fetch the user's winning entries on client side using the server component client
  useEffect(() => {
    async function fetchEntries() {
      const supabase = createServerComponentClient<{ [key: string]: any }>({ cookies });
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        // not authenticated, redirect to login
        router.replace('/login');
        return;
      }
      const { data, error } = await supabase
        .from('draw_entries')
        .select('id, draw_id, prize_tier, prize_amount, payout_status, winner_verifications(*)')
        .eq('user_id', session.session.user.id)
        .eq('is_winner', true);
      if (error) {
        console.error('Error fetching draw entries', error);
        return;
      }
      // Normalise verification data
      const normalized = data?.map((d: any) => ({
        ...d,
        verification: d.winner_verifications?.[0] ?? null,
      }));
      setEntries(normalized ?? []);
      setLoading(false);
    }
    fetchEntries();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, entryId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entryId', entryId);
    setUploading(entryId);
    fetch('/api/winners/verify', {
      method: 'POST',
      body: formData,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Upload failed');
        // refresh list
        const refreshed = await fetch('/api/winners/verify?list=true');
        const json = await refreshed.json();
        setEntries(json.entries);
      })
      .catch((err) => console.error(err))
      .finally(() => setUploading(null));
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl font-medium">Loading your winnings...</div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No winnings yet</h1>
        <p className="text-gray-600">Score more and you could be here!</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Your Winnings</h1>
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-5 mb-4 flex flex-col"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-lg font-medium">Prize: {entry.prize_tier ?? 'N/A'}</p>
                <p className="text-gray-600">Amount: {entry.prize_amount ? `${entry.prize_amount} €` : '—'}</p>
                <p className="text-sm text-gray-500 mt-1">Payout status: {entry.payout_status}</p>
              </div>
            </div>

            {/* Verification section */}
            {entry.verification ? (
              <div className="mt-4 flex items-center">
                <Image
                  src={entry.verification.proof_url}
                  alt="Proof"
                  width={80}
                  height={80}
                  className="rounded border"
                />
                <p className="ml-4 text-sm">
                  Verification status: {entry.verification.status}
                </p>
              </div>
            ) : (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload proof of delivery (required for payout)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading === entry.id}
                  onChange={(e) => handleFileChange(e, entry.id)}
                  className="border rounded p-2 w-full"
                />
                {uploading === entry.id && (
                  <p className="mt-2 text-sm text-blue-600">Uploading…</p>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
