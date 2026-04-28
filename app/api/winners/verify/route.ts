import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';

/**
 * POST /api/winners/verify
 * Upload winner proof image to Supabase storage and create a verification row.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const drawEntryId = formData.get('drawEntryId')?.toString();
    const file = formData.get('file') as File | null;

    if (!drawEntryId || !file) {
      return NextResponse.json({ error: 'Missing drawEntryId or file' }, { status: 400 });
    }

    // Init Supabase server client (service role)
    const supabase = await createServerClient();

    // Verify the user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }
    const userId = session.user.id;

    // Verify the draw entry belongs to this user
    const { data: entry, error: entryErr } = await supabase
      .from('draw_entries')
      .select('id')
      .eq('id', drawEntryId)
      .eq('user_id', userId)
      .single();
    if (entryErr || !entry) {
      return NextResponse.json({ error: 'Invalid draw entry' }, { status: 403 });
    }

    // Upload file to Supabase storage bucket 'winner-proofs'
    const fileExt = file.name.split('.').pop();
    const fileName = `${nanoid()}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const { error: uploadErr } = await supabase.storage
      .from('winner-proofs')
      .upload(fileName, Buffer.from(arrayBuffer), {
        contentType: file.type,
      });
    if (uploadErr) {
      return NextResponse.json({ error: 'Upload failed', details: uploadErr.message }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('winner-proofs')
      .getPublicUrl(fileName);

    // Insert verification record
    const { error: insertErr } = await supabase.from('winner_verifications').insert({
      draw_entry_id: drawEntryId,
      user_id: userId,
      proof_url: publicUrl,
      status: 'pending',
    });
    if (insertErr) {
      return NextResponse.json({ error: 'DB insert failed', details: insertErr.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Verification submitted', proofUrl: publicUrl }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

/**
 * GET /api/winners/verify?list=true
 * Returns the current user's winning entries with verification info.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const list = url.searchParams.get('list') === 'true';
  if (!list) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  const userId = session.user.id;

  const { data, error } = await supabase
    .from('draw_entries')
    .select('id, draw_id, prize_tier, prize_amount, payout_status, winner_verifications(*)')
    .eq('user_id', userId)
    .eq('is_winner', true);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }

  const normalized = data?.map((d: any) => ({
    ...d,
    verification: d.winner_verifications?.[0] ?? null,
  })) ?? [];

  return NextResponse.json({ entries: normalized });
}
