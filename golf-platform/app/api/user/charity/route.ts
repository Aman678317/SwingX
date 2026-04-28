import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Authenticated: update profile charity_id and charity_contribution_percent
export async function PUT(req: Request) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { charity_id, charity_contribution_percent } = body;

    if (!charity_id) {
      return NextResponse.json({ error: 'Charity ID is required' }, { status: 400 });
    }

    const contribution = Number(charity_contribution_percent);
    if (isNaN(contribution) || contribution < 10 || contribution > 100) {
      return NextResponse.json({ error: 'Contribution percent must be between 10 and 100' }, { status: 400 });
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        charity_id,
        charity_contribution_percent: contribution
      })
      .eq('id', session.user.id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Charity preferences updated' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
