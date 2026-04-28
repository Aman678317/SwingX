'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Charity {
  id: string;
  name: string;
  description: string;
  image_url: string;
  is_featured: boolean;
}

export default function CharitiesPage() {
  const [charities, setCharities] = useState<Charity[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCharities() {
      try {
        const res = await fetch('/api/charities');
        if (res.ok) {
          const data = await res.json();
          setCharities(data);
        }
      } catch (error) {
        console.error('Failed to fetch charities:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCharities();
  }, []);

  const filteredCharities = charities.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const featuredCharities = filteredCharities.filter(c => c.is_featured);
  const regularCharities = filteredCharities.filter(c => !c.is_featured);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading charities...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Our Charity Partners</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Every subscription helps support these amazing organizations. You choose where your contribution goes.
        </p>
      </div>

      <div className="mb-8 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Search charities by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
        />
      </div>

      {featuredCharities.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Featured Charities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCharities.map(charity => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">All Charities</h2>
        {regularCharities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularCharities.map(charity => (
              <CharityCard key={charity.id} charity={charity} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No charities found matching your search.</p>
        )}
      </div>
    </div>
  );
}

function CharityCard({ charity }: { charity: Charity }) {
  return (
    <Link href={`/charities/${charity.id}`} className="group block h-full">
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700 h-full flex flex-col">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 relative w-full flex-shrink-0">
          {charity.image_url ? (
             // Replace with next/image if you have configured domains
             <img 
               src={charity.image_url} 
               alt={charity.name} 
               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
          )}
          {charity.is_featured && (
            <span className="absolute top-4 right-4 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              Featured
            </span>
          )}
        </div>
        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{charity.name}</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 mb-4 flex-grow">
            {charity.description}
          </p>
          <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:underline mt-auto">
            View Details &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
