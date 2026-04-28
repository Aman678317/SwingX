import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { data: scores, error } = await supabase
    .from('scores')
    .select('*')
    .eq('user_id', session.user.id)
    .order('score_date', { ascending: false })
    .limit(5);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }

  return NextResponse.json(scores);
}

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const userId = session.user.id;

  // Check subscription status
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status')
    .eq('id', userId)
    .single();

  if (profile?.subscription_status !== 'active') {
    return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const score = Number(body.score);
    const score_date = body.score_date;

    if (!score || score < 1 || score > 45 || !score_date) {
      return NextResponse.json({ error: 'Invalid score or date' }, { status: 400 });
    }

    // Check unique constraint manually to return 409
    const { data: existingDateScore } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', userId)
      .eq('score_date', score_date)
      .single();

    if (existingDateScore) {
      return NextResponse.json({ error: 'Score for this date already exists' }, { status: 409 });
    }

    // Count existing scores
    const { count } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const currentCount = count || 0;

    if (currentCount >= 5) {
      // Delete the oldest score
      const { data: oldestScore } = await supabase
        .from('scores')
        .select('id')
        .eq('user_id', userId)
        .order('score_date', { ascending: true })
        .limit(1)
        .single();

      if (oldestScore) {
        await supabase.from('scores').delete().eq('id', oldestScore.id);
      }
    }

    // Insert new score
    const { data: newScore, error: insertError } = await supabase
      .from('scores')
      .insert({
        user_id: userId,
        score,
        score_date,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Return updated scores list
    const { data: updatedScores } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('score_date', { ascending: false })
      .limit(5);

    return NextResponse.json(updatedScores);
  } catch (error: any) {
    console.error('Score POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
