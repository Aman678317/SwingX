import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from('scores')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const score = Number(body.score);
    const score_date = body.score_date;

    if (!score || score < 1 || score > 45 || !score_date) {
      return NextResponse.json({ error: 'Invalid score or date' }, { status: 400 });
    }

    const { id } = await params;
    // Check unique constraint for the new date, excluding the current score
    const { data: existingDateScore } = await supabase
      .from('scores')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('score_date', score_date)
      .neq('id', id)
      .single();

    if (existingDateScore) {
      return NextResponse.json({ error: 'Score for this date already exists' }, { status: 409 });
    }

    const { error: updateError } = await supabase
      .from('scores')
      .update({ score, score_date })
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
