import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { sendWelcomeEmail, sendSubscriptionRenewalEmail } from '@/lib/email';

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const userId = session.client_reference_id || session.metadata?.userId;
        const plan = session.metadata?.plan;
        
        if (userId && session.subscription) {
          // Fetch the subscription to get the renewal date
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'active',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_plan: plan,
              subscription_renewal_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', userId);
            
            // Send welcome email via Resend
            const { data: profile } = await supabase.from('profiles').select('full_name, email').eq('id', userId).single();
            if (profile?.email) {
              await sendWelcomeEmail(profile.email, profile.full_name || 'Golfer');
            }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Find profile by stripe_subscription_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: subscription.status === 'active' ? 'active' : 'inactive',
              subscription_renewal_date: new Date(subscription.current_period_end * 1000).toISOString()
            })
            .eq('id', profile.id);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single();
          
        if (profile) {
          await supabase
            .from('profiles')
            .update({
              subscription_status: 'cancelled'
            })
            .eq('id', profile.id);
        }
        break;
      }

      case 'invoice.upcoming': {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.customer) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('stripe_customer_id', invoice.customer as string)
            .single();
          
          if (profile?.email) {
            await sendSubscriptionRenewalEmail(
              profile.email, 
              profile.full_name || 'Golfer', 
              new Date(invoice.next_payment_attempt! * 1000).toISOString()
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
