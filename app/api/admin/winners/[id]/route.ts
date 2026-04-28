import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { sendWinnerApprovedEmail } from '@/lib/email';

/**
 * PATCH /api/admin/winners/[id]
 * Update a verification record (status, payout_status, admin_notes).
 * Expected JSON body: { status?: string, payout_status?: string, admin_notes?: string }
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerClient();

  // Auth & admin check
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

  let payload: { status?: string; payout_status?: string; admin_notes?: string };
  try {
    payload = await req.json();
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { status, payout_status, admin_notes } = payload;
  const id = params.id;

  const updates: any = {};
  if (status) updates.status = status;
  if (payout_status) updates.payout_status = payout_status;
  if (admin_notes) updates.admin_notes = admin_notes;

  const { error: updateErr } = await supabase
    .from('winner_verifications')
    .update(updates)
    .eq('id', id);

  if (updateErr) {
    return NextResponse.json({ error: 'Update failed', details: updateErr.message }, { status: 500 });
  }

  // Trigger email notifications if approved
  if (status === 'approved') {
    const { data: verification } = await supabase
      .from('winner_verifications')
      .select('draw_entries(prize_amount), profiles(email, full_name)')
      .eq('id', id)
      .single();

    if (verification?.profiles?.email && verification.draw_entries?.prize_amount) {
      await sendWinnerApprovedEmail(
        verification.profiles.email, 
        verification.profiles.full_name || 'Golfer', 
        verification.draw_entries.prize_amount
      );
    }
  }

  return NextResponse.json({ message: 'Verification updated' });
}
