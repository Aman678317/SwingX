import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { sendDrawResultEmail } from '@/lib/email';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // Check admin role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: drawId } = await params;

    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('status')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status !== 'simulated') {
      return NextResponse.json({ error: 'Draw must be simulated before publishing' }, { status: 400 });
    }

    // Set draw status='published'
    const { error: updateError } = await supabase
      .from('draws')
      .update({ status: 'published' })
      .eq('id', drawId);

    if (updateError) throw updateError;

    // Create winner_verifications records for each winner
    const { data: winningEntries } = await supabase
      .from('draw_entries')
      .select('id, user_id, prize_amount, match_count, profiles(full_name, email)')
      .eq('draw_id', drawId)
      .eq('is_winner', true);

    if (winningEntries && winningEntries.length > 0) {
      const verificationsToInsert = winningEntries.map(entry => ({
        draw_entry_id: entry.id,
        user_id: entry.user_id,
        status: 'pending',
        payout_status: 'pending'
      }));

      const { error: verificationError } = await supabase
        .from('winner_verifications')
        .insert(verificationsToInsert);

      if (verificationError) throw verificationError;

      // Trigger email notifications (Phase 12 Integration)
      for (const entry of winningEntries) {
        const email = entry.profiles?.email;
        const name = entry.profiles?.full_name || 'Golfer';
        if (email && entry.prize_amount) {
          await sendDrawResultEmail(email, name, entry.match_count, entry.prize_amount);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Draw published and winners notified' });
  } catch (error: any) {
    console.error('Error publishing draw:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
