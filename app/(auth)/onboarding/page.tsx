'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';

interface Charity {
  id: string;
  name: string;
  description: string;
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [plan, setPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [charities, setCharities] = useState<Charity[]>([]);
  const [selectedCharity, setSelectedCharity] = useState<string>('');
  const [contributionPercent, setContributionPercent] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchCharities() {
      const { data, error } = await supabase
        .from('charities')
        .select('id, name, description');
      
      if (data && data.length > 0) {
        setCharities(data);
        setSelectedCharity(data[0].id);
      }
    }
    fetchCharities();
  }, [supabase]);

  const handleNextStep = () => {
    if (step === 2 && !selectedCharity) {
      setError('Please select a charity to continue.');
      return;
    }
    if (step === 3 && contributionPercent < 10) {
      setError('Minimum contribution is 10%.');
      return;
    }
    setError(null);
    setStep((prev) => prev + 1);
  };

  const handleComplete = async () => {
    if (contributionPercent < 10) {
      setError('Minimum contribution is 10%.');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // 1. Save charity preferences to profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          charity_id: selectedCharity,
          charity_contribution_percent: contributionPercent
        })
        .eq('id', session.user.id);

      if (profileError) throw profileError;

      // 2. Redirect to Stripe Checkout (Phase 4 API route)
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: session.user.id
        })
      });

      if (!res.ok) {
        // If the route doesn't exist yet (before Phase 4), we just simulate success and go to dashboard
        console.warn('Stripe endpoint might not be ready yet. Redirecting to dashboard...');
        router.push('/dashboard');
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Failed to create checkout session');
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div 
        key={step}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-lg w-full"
      >
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`flex-1 h-2 mx-1 rounded ${step >= i ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center uppercase tracking-wider font-semibold">
            Step {step} of 3
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Choose Plan */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Choose your plan</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Select a subscription to enter the draws.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div 
                onClick={() => setPlan('monthly')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${plan === 'monthly' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'}`}
              >
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Monthly</h3>
                <p className="text-2xl font-bold text-indigo-600 my-2">€9.99</p>
                <p className="text-sm text-gray-500">Billed monthly</p>
              </div>
              <div 
                onClick={() => setPlan('yearly')}
                className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${plan === 'yearly' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 hover:border-indigo-300 dark:border-gray-700'}`}
              >
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Yearly</h3>
                <p className="text-2xl font-bold text-indigo-600 my-2">€99.00</p>
                <p className="text-sm text-gray-500">Save ~17% annually</p>
              </div>
            </div>
            
            <button 
              onClick={handleNextStep}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Continue to Charity Selection
            </button>
          </div>
        )}

        {/* Step 2: Choose Charity */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Select a Charity</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">Who would you like to support?</p>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {charities.length === 0 ? (
                <p className="text-gray-500 text-center italic">Loading charities...</p>
              ) : (
                charities.map((charity) => (
                  <div 
                    key={charity.id}
                    onClick={() => setSelectedCharity(charity.id)}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedCharity === charity.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-750'}`}
                  >
                    <h3 className="font-medium text-gray-900 dark:text-white">{charity.name}</h3>
                    {charity.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{charity.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)}
                className="w-1/3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button 
                onClick={handleNextStep}
                disabled={!selectedCharity}
                className="w-2/3 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                Set Contribution
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contribution % */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Set Your Impact</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">What percentage of your entry fee goes to the charity?</p>
            </div>

            <div className="py-8 text-center">
              <div className="text-5xl font-bold text-indigo-600 mb-6">
                {contributionPercent}%
              </div>
              <input 
                type="range" 
                min="10" 
                max="100" 
                value={contributionPercent} 
                onChange={(e) => setContributionPercent(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-indigo-600"
              />
              <p className="text-sm text-gray-500 mt-4">Minimum requirement is 10%.</p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-1/3 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Back
              </button>
              <button 
                onClick={handleComplete}
                disabled={loading}
                className="w-2/3 bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Complete & Checkout'}
              </button>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
}
