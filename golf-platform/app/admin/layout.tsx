import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ReactNode } from 'react';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col">
        <div className="p-6">
          <h2 className="text-2xl font-bold">Admin Panel</h2>
          <p className="text-indigo-300 text-sm mt-1">Golf Charity Platform</p>
        </div>
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          <Link href="/admin/users" className="block px-4 py-3 rounded hover:bg-indigo-800 transition">
            Users
          </Link>
          <Link href="/admin/draws" className="block px-4 py-3 rounded hover:bg-indigo-800 transition">
            Draws
          </Link>
          <Link href="/admin/charities" className="block px-4 py-3 rounded hover:bg-indigo-800 transition">
            Charities
          </Link>
          <Link href="/admin/winners" className="block px-4 py-3 rounded hover:bg-indigo-800 transition">
            Winners
          </Link>
          <Link href="/admin/analytics" className="block px-4 py-3 rounded hover:bg-indigo-800 transition">
            Analytics
          </Link>
        </nav>
        <div className="p-4 border-t border-indigo-800">
          <Link href="/dashboard" className="block px-4 py-2 text-center text-indigo-300 hover:text-white hover:bg-indigo-800 rounded transition">
            &larr; Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
