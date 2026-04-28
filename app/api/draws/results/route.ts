import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createServerClient();

  try {
    const { data: draws, error } = await supabase
      .from('draws')
      .select(`
        id,
        draw_month,
        drawn_numbers,
        jackpot_amount,
        four_match_amount,
        three_match_amount,
        jackpot_rolled_over,
        draw_entries (
          prize_tier,
          prize_amount,
          match_count
        )
      `)
      .eq('status', 'published')
      .order('draw_month', { ascending: false })
      .limit(3);

    if (error) throw error;

    // Format the response to aggregate prize tiers without exposing identities
    const formattedDraws = draws.map((draw: any) => {
      const tiers = {
        '5-match': { winners: 0, amount: draw.jackpot_amount },
        '4-match': { winners: 0, amount: draw.four_match_amount },
        '3-match': { winners: 0, amount: draw.three_match_amount },
      };

      draw.draw_entries?.forEach((entry: any) => {
        if (entry.prize_tier === '5-match') tiers['5-match'].winners++;
        if (entry.prize_tier === '4-match') tiers['4-match'].winners++;
        if (entry.prize_tier === '3-match') tiers['3-match'].winners++;
      });

      return {
        id: draw.id,
        draw_month: draw.draw_month,
        drawn_numbers: draw.drawn_numbers,
        jackpot_rolled_over: draw.jackpot_rolled_over,
        prize_tiers: tiers
      };
    });

    return NextResponse.json(formattedDraws);
  } catch (error: any) {
    console.error('Error fetching draw results:', error);
    return NextResponse.json({ error: 'Failed to fetch draw results' }, { status: 500 });
  }
}
