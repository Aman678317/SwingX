-- USERS (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'subscriber', -- 'subscriber' | 'admin'
  subscription_status TEXT DEFAULT 'inactive', -- 'active' | 'inactive' | 'cancelled' | 'lapsed'
  subscription_plan TEXT, -- 'monthly' | 'yearly'
  subscription_renewal_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  charity_id UUID, -- Will add foreign key after charities table is created
  charity_contribution_percent INT DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHARITIES
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  upcoming_events JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint to profiles now that charities exists
ALTER TABLE profiles ADD CONSTRAINT fk_charity_id FOREIGN KEY (charity_id) REFERENCES charities(id);

-- GOLF SCORES
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score INT CHECK (score BETWEEN 1 AND 45),
  score_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, score_date) -- one score per date per user
);

-- DRAWS
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_month DATE NOT NULL, -- first day of the month
  status TEXT DEFAULT 'pending', -- 'pending' | 'simulated' | 'published'
  draw_type TEXT DEFAULT 'random', -- 'random' | 'algorithmic'
  drawn_numbers INT[], -- 5 numbers drawn
  jackpot_amount DECIMAL,
  four_match_amount DECIMAL,
  three_match_amount DECIMAL,
  jackpot_rolled_over BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAW ENTRIES (user score snapshots at draw time)
CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID REFERENCES draws(id),
  user_id UUID REFERENCES profiles(id),
  score_snapshot INT[], -- user's 5 scores at time of draw
  match_count INT DEFAULT 0,
  is_winner BOOLEAN DEFAULT FALSE,
  prize_tier TEXT, -- '5-match' | '4-match' | '3-match'
  prize_amount DECIMAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WINNER VERIFICATION
CREATE TABLE winner_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_entry_id UUID REFERENCES draw_entries(id),
  user_id UUID REFERENCES profiles(id),
  proof_url TEXT,
  status TEXT DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  payout_status TEXT DEFAULT 'pending', -- 'pending' | 'paid'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winner_verifications ENABLE ROW LEVEL SECURITY;

-- Write RLS policies

-- profiles: users can read/update their own row; admins can read all
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- scores: users can CRUD their own scores; admins can CRUD all
CREATE POLICY "Users can view own scores" ON scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON scores FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all scores" ON scores FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- charities: public read; admin write
CREATE POLICY "Charities are publicly readable" ON charities FOR SELECT USING (true);
CREATE POLICY "Admins can manage charities" ON charities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- draws: public read if published; admin full access
CREATE POLICY "Published draws are publicly readable" ON draws FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage draws" ON draws FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- draw_entries: users read their own; admins read all
CREATE POLICY "Users can view own draw entries" ON draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all draw entries" ON draw_entries FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- winner_verifications: users read their own; admins full access
CREATE POLICY "Users can view own verifications" ON winner_verifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage verifications" ON winner_verifications FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
