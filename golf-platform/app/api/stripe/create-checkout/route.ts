import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const { plan, userId } = await req.json();

    if (!plan || !userId) {
      return NextResponse.json({ error: 'Missing plan or userId' }, { status: 400 });
    }

    const priceId = plan === 'monthly' 
      ? process.env.STRIPE_MONTHLY_PRICE_ID 
      : process.env.STRIPE_YEARLY_PRICE_ID;

    if (!priceId) {
      return NextResponse.json({ error: 'Stripe price ID not configured' }, { status: 500 });
    }

    // Optional: get customer ID from Supabase if they already have one
    const supabase = createServerClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', userId)
      .single();

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const sessionData: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard?success=true`,
      cancel_url: `${baseUrl}/onboarding`,
      client_reference_id: userId, // Used to link webhook to user
      metadata: {
        userId,
        plan,
      }
    };

    if (profile?.stripe_customer_id) {
      sessionData.customer = profile.stripe_customer_id;
    } else if (profile?.email) {
      sessionData.customer_email = profile.email;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
