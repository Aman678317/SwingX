import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

// Public: return all charities
export async function GET() {
  const supabase = createServerClient();
  try {
    const { data: charities, error } = await supabase
      .from('charities')
      .select('id, name, description, image_url, is_featured, upcoming_events')
      .order('is_featured', { ascending: false })
      .order('name', { ascending: true });

    if (error) throw error;
    return NextResponse.json(charities);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Admin only: insert new charity
export async function POST(req: Request) {
  const supabase = createServerClient();
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
    const { name, description, image_url, is_featured, upcoming_events } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data: charity, error } = await supabase
      .from('charities')
      .insert({
        name,
        description,
        image_url,
        is_featured: is_featured || false,
        upcoming_events: upcoming_events || []
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(charity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
