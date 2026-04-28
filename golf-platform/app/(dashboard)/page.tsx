import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // 1. Fetch Profile (Subscription & Charity preferences)
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      subscription_status,
      subscription_plan,
      subscription_renewal_date,
      charity_contribution_percent,
      charities (id, name, image_url)
    `)
    .eq('id', userId)
    .single();

  // 2. Fetch recent scores
  const { data: scores } = await supabase
    .from('scores')
    .select('id, score, score_date')
    .eq('user_id', userId)
    .order('score_date', { ascending: false })
    .limit(5);

  // 3. Fetch participation & winnings
  const { data: entries } = await supabase
    .from('draw_entries')
    .select('id, is_winner, prize_amount, payout_status')
    .eq('user_id', userId);

  const drawsEntered = entries?.length || 0;
  
  let totalWinnings = 0;
  let pendingPayouts = 0;

  entries?.forEach(entry => {
    if (entry.is_winner && entry.prize_amount) {
      totalWinnings += Number(entry.prize_amount);
      if (entry.payout_status === 'pending') {
        pendingPayouts++;
      }
    }
  });

  // Calculate next draw date (first of next month)
  const now = new Date();
  const nextDrawDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const dashboardData = {
    subscription: {
      status: profile?.subscription_status || 'inactive',
      plan: profile?.subscription_plan || 'None',
      renewalDate: profile?.subscription_renewal_date,
    },
    scores: scores || [],
    charity: {
      name: profile?.charities?.name || 'Not Selected',
      imageUrl: profile?.charities?.image_url,
      contributionPercent: profile?.charity_contribution_percent || 10,
    },
    participation: {
      drawsEntered,
      nextDrawDate: nextDrawDate.toISOString(),
    },
    winnings: {
      totalAmount: totalWinnings,
      pendingCount: pendingPayouts,
    }
  };

  return <DashboardClient data={dashboardData} />;
}
