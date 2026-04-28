import { createServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface Event {
  event_name: string;
  date: string;
  location: string;
}

export default async function CharityDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  
  const { data: charity, error } = await supabase
    .from('charities')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !charity) {
    notFound();
  }

  const upcomingEvents: Event[] = charity.upcoming_events || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Link href="/charities" className="text-indigo-600 hover:underline mb-8 inline-block">
        &larr; Back to all charities
      </Link>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="h-64 md:h-96 bg-gray-200 dark:bg-gray-700 relative w-full">
          {charity.image_url ? (
             <img 
               src={charity.image_url} 
               alt={charity.name} 
               className="w-full h-full object-cover" 
             />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400 text-lg">No Image Available</div>
          )}
        </div>
        
        <div className="p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-8">
            <div>
              {charity.is_featured && (
                <span className="inline-block bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3">
                  Featured Partner
                </span>
              )}
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">{charity.name}</h1>
            </div>
            
            {/* CTA to donate independently. In a real app, you'd add an actual URL field to the charities table */}
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition"
              onClick={(e) => {
                e.preventDefault();
                alert('This would link to the charity\'s direct donation page.');
              }}
            >
              Donate Independently
            </a>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-12">
            <h2 className="text-xl font-semibold mb-4">About the Charity</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
              {charity.description}
            </p>
          </div>

          {upcomingEvents.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Upcoming Events</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="border dark:border-gray-700 rounded-lg p-5 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">{event.event_name}</h3>
                    <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <span className="flex items-center gap-2">
                        📅 {new Date(event.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-2">
                        📍 {event.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
