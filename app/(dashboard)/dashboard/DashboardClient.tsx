'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

// Simple spring counter component
function AnimatedCounter({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeOutExpo
      const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(ease * value));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{count}</span>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function DashboardClient({ data }: { data: any }) {
  
  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;
    try {
      const res = await fetch('/api/stripe/cancel', { method: 'POST' });
      if (res.ok) {
        alert('Subscription cancelled successfully.');
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Error: ${err.error}`);
      }
    } catch (e: any) {
      alert('An error occurred');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Welcome back. Here is your current platform summary.</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* 1. Subscription Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Subscription</h2>
          <div className="flex-grow space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Status</span>
              <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase ${data.subscription.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                {data.subscription.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Plan</span>
              <span className="font-medium capitalize">{data.subscription.plan}</span>
            </div>
            {data.subscription.renewalDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Renews</span>
                <span className="font-medium">{new Date(data.subscription.renewalDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          {data.subscription.status === 'active' && (
            <button onClick={handleCancelSubscription} className="mt-6 w-full text-sm text-red-600 hover:text-red-700 font-medium py-2 rounded bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition">
              Cancel Subscription
            </button>
          )}
        </motion.div>

        {/* 2. Scores Summary Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Scores</h2>
            <Link href="/dashboard/scores" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Add Score</Link>
          </div>
          <div className="flex-grow">
            {data.scores.length === 0 ? (
              <p className="text-gray-500 text-sm">No scores recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {data.scores.map((s: any) => (
                  <li key={s.id} className="flex justify-between items-center text-sm border-b dark:border-gray-700 pb-2 last:border-0 last:pb-0">
                    <span className="text-gray-600 dark:text-gray-400">{new Date(s.score_date).toLocaleDateString()}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{s.score} pts</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>

        {/* 3. Charity Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Charity Impact</h2>
            <Link href="/dashboard/charity" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">Change</Link>
          </div>
          <div className="flex-grow flex flex-col items-center justify-center text-center space-y-3">
            {data.charity.imageUrl && (
              <img src={data.charity.imageUrl} alt={data.charity.name} className="h-12 w-12 rounded-full object-cover border" />
            )}
            <h3 className="font-medium text-gray-900 dark:text-white">{data.charity.name}</h3>
            <div className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-lg font-bold text-lg flex flex-col items-center">
              <span className="text-xs uppercase tracking-wider text-indigo-500 dark:text-indigo-400 mb-1">Contribution</span>
              <span><AnimatedCounter value={data.charity.contributionPercent} />%</span>
            </div>
          </div>
        </motion.div>

        {/* 4. Participation Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Participation</h2>
          <div className="flex-grow flex flex-col justify-center space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Draws Entered</p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white">
                <AnimatedCounter value={data.participation.drawsEntered} />
              </p>
            </div>
            <div className="text-center border-t dark:border-gray-700 pt-4">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Next Draw Date</p>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                {new Date(data.participation.nextDrawDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 5. Winnings Card */}
        <motion.div variants={cardVariants} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border dark:border-gray-700 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Winnings</h2>
            <Link href="/dashboard/winnings" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View Details</Link>
          </div>
          <div className="flex-grow flex flex-col justify-center space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Amount</p>
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                €<AnimatedCounter value={data.winnings.totalAmount} />
              </p>
            </div>
            <div className="flex justify-between items-center border-t dark:border-gray-700 pt-4 px-2">
              <span className="text-gray-500 text-sm">Pending Payouts</span>
              <span className="font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/30 px-2 py-1 rounded">
                {data.winnings.pendingCount}
              </span>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
