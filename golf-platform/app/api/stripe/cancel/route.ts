import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    
    // Auth check
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get the user's subscription ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_subscription_id')
      .eq('id', userId)
      .single();

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    // Cancel in Stripe (cancel at period end, or immediately? usually at period end is better, 
    // but the prompt says POST: calls stripe.subscriptions.cancel(subscriptionId))
    const canceledSubscription = await stripe.subscriptions.cancel(profile.stripe_subscription_id);

    // Update in Supabase
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'cancelled'
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update local profile' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Subscription cancelled successfully', subscription: canceledSubscription });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
