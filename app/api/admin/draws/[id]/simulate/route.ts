import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // Check admin role
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (adminProfile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { id: drawId } = await params;

    // Get the draw
    const { data: draw, error: drawError } = await supabase
      .from('draws')
      .select('*')
      .eq('id', drawId)
      .single();

    if (drawError || !draw) {
      return NextResponse.json({ error: 'Draw not found' }, { status: 404 });
    }

    if (draw.status !== 'pending') {
      return NextResponse.json({ error: 'Draw already simulated or published' }, { status: 400 });
    }

    let drawn_numbers: number[] = [];

    if (draw.draw_type === 'random') {
      // Generate 5 unique random numbers from 1-45
      const nums = new Set<number>();
      while (nums.size < 5) {
        nums.add(Math.floor(Math.random() * 45) + 1);
      }
      drawn_numbers = Array.from(nums);
    } else if (draw.draw_type === 'algorithmic') {
      // Algorithmic draw
      const currentMonth = new Date(draw.draw_month);
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).toISOString();
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).toISOString();

      // Query scores from active subscribers in the month
      const { data: activeProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('subscription_status', 'active');

      const activeUserIds = activeProfiles?.map(p => p.id) || [];

      let scoreCounts: Record<number, number> = {};
      for (let i = 1; i <= 45; i++) scoreCounts[i] = 0;

      if (activeUserIds.length > 0) {
        const { data: scores } = await supabase
          .from('scores')
          .select('score')
          .in('user_id', activeUserIds)
          .gte('score_date', startOfMonth)
          .lte('score_date', endOfMonth);

        scores?.forEach(s => {
          if (s.score >= 1 && s.score <= 45) {
            scoreCounts[s.score] = (scoreCounts[s.score] || 0) + 1;
          }
        });
      }

      // Calculate weights (inverse frequency)
      const maxCount = Math.max(...Object.values(scoreCounts));
      let pool: number[] = [];

      for (let i = 1; i <= 45; i++) {
        // Add more instances to the pool for lower frequencies
        const weight = maxCount - scoreCounts[i] + 1; 
        for (let w = 0; w < weight; w++) {
          pool.push(i);
        }
      }

      const nums = new Set<number>();
      while (nums.size < 5 && pool.length > 0) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        const selected = pool[randomIndex];
        nums.add(selected);
        // remove all instances of selected from pool
        pool = pool.filter(n => n !== selected);
      }

      // fallback if logic fails
      while (nums.size < 5) {
        const fallback = Math.floor(Math.random() * 45) + 1;
        nums.add(fallback);
      }
      
      drawn_numbers = Array.from(nums);
    }

    // Fetch active subscribers
    const { data: activeSubscribers } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active');

    const totalSubscribers = activeSubscribers?.length || 0;
    const FIXED_CONTRIBUTION = 5; // e.g., €5 per sub to prize pool
    const totalPrizePool = totalSubscribers * FIXED_CONTRIBUTION;

    // Check previous draw for jackpot rollover
    const { data: previousDraws } = await supabase
      .from('draws')
      .select('jackpot_amount, jackpot_rolled_over')
      .order('draw_month', { ascending: false })
      .lt('draw_month', draw.draw_month)
      .limit(1);

    let rolloverAmount = 0;
    if (previousDraws && previousDraws.length > 0 && previousDraws[0].jackpot_rolled_over) {
      rolloverAmount = previousDraws[0].jackpot_amount || 0;
    }

    const fiveMatchPool = (totalPrizePool * 0.40) + rolloverAmount;
    const fourMatchPool = totalPrizePool * 0.35;
    const threeMatchPool = totalPrizePool * 0.25;

    let fiveMatchWinners = 0;
    let fourMatchWinners = 0;
    let threeMatchWinners = 0;

    const entriesToInsert: any[] = [];

    // Evaluate scores for each subscriber
    if (activeSubscribers) {
      for (const sub of activeSubscribers) {
        const { data: latestScores } = await supabase
          .from('scores')
          .select('score')
          .eq('user_id', sub.id)
          .order('score_date', { ascending: false })
          .limit(5);

        if (latestScores && latestScores.length > 0) {
          const snapshot = latestScores.map(s => s.score);
          let match_count = 0;
          snapshot.forEach(score => {
            if (drawn_numbers.includes(score)) match_count++;
          });

          let prize_tier = null;
          let is_winner = false;

          if (match_count === 5) {
            prize_tier = '5-match';
            is_winner = true;
            fiveMatchWinners++;
          } else if (match_count === 4) {
            prize_tier = '4-match';
            is_winner = true;
            fourMatchWinners++;
          } else if (match_count === 3) {
            prize_tier = '3-match';
            is_winner = true;
            threeMatchWinners++;
          }

          entriesToInsert.push({
            draw_id: drawId,
            user_id: sub.id,
            score_snapshot: snapshot,
            match_count,
            is_winner,
            prize_tier,
            prize_amount: null, // will update after counting winners
          });
        }
      }
    }

    // Calculate individual prize amounts
    const fiveMatchPrize = fiveMatchWinners > 0 ? fiveMatchPool / fiveMatchWinners : 0;
    const fourMatchPrize = fourMatchWinners > 0 ? fourMatchPool / fourMatchWinners : 0;
    const threeMatchPrize = threeMatchWinners > 0 ? threeMatchPool / threeMatchWinners : 0;

    const finalEntries = entriesToInsert.map(entry => {
      let amount = null;
      if (entry.prize_tier === '5-match') amount = fiveMatchPrize;
      if (entry.prize_tier === '4-match') amount = fourMatchPrize;
      if (entry.prize_tier === '3-match') amount = threeMatchPrize;
      return { ...entry, prize_amount: amount };
    });

    // Delete existing entries for this draw if any
    await supabase.from('draw_entries').delete().eq('draw_id', drawId);

    // Insert entries
    if (finalEntries.length > 0) {
      const { error: entriesError } = await supabase.from('draw_entries').insert(finalEntries);
      if (entriesError) throw entriesError;
    }

    const isJackpotRolledOver = fiveMatchWinners === 0;

    // Update draw status
    const { error: updateDrawError } = await supabase
      .from('draws')
      .update({
        status: 'simulated',
        drawn_numbers,
        jackpot_amount: fiveMatchPool,
        four_match_amount: fourMatchPool,
        three_match_amount: threeMatchPool,
        jackpot_rolled_over: isJackpotRolledOver
      })
      .eq('id', drawId);

    if (updateDrawError) throw updateDrawError;

    return NextResponse.json({ 
      success: true, 
      drawn_numbers,
      winners: {
        '5-match': fiveMatchWinners,
        '4-match': fourMatchWinners,
        '3-match': threeMatchWinners
      },
      pools: {
        '5-match': fiveMatchPool,
        '4-match': fourMatchPool,
        '3-match': threeMatchPool
      },
      jackpotRolledOver: isJackpotRolledOver
    });

  } catch (error: any) {
    console.error('Error simulating draw:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
