import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { id, full_name, email } = await req.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Init Supabase server client (using service role or anon key, depending on RLS)
    const supabase = createServerClient();

    // Insert into profiles table
    const { error } = await supabase.from('profiles').insert({
      id,
      full_name,
      email,
      role: 'subscriber',
      subscription_status: 'inactive'
    });

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Profile created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
