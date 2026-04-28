import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { draw_month, draw_type } = body;

    if (!draw_month || !['random', 'algorithmic'].includes(draw_type)) {
      return NextResponse.json({ error: 'Invalid draw_month or draw_type' }, { status: 400 });
    }

    const { data: draw, error: insertError } = await supabase
      .from('draws')
      .insert({
        draw_month,
        draw_type,
        status: 'pending',
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ draw }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating draw:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
