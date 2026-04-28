import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/admin/winners
 * Returns all winner verification records with related user and draw entry data.
 */
export async function GET() {
  const supabase = createServerClient();

  // Ensure admin access
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const { data: adminProfile, error: adminErr } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  if (adminErr || adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('winner_verifications')
    .select(
      `id, status, payout_status, admin_notes, proof_url, created_at, \n       draw_entries (id, prize_tier, prize_amount, draw_id, \n         draws (draw_month, status))`
    )
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 });
  }

  return NextResponse.json({ verifications: data });
}

