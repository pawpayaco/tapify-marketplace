-- Managers Table
-- Tracks store managers who share Pawpaya with franchise owners
-- Managers get rewarded when their referral completes onboarding

CREATE TABLE IF NOT EXISTS managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text UNIQUE NOT NULL,
  reward_sent boolean DEFAULT false,
  reward_type text,
  reward_date timestamp with time zone,
  total_referrals integer DEFAULT 0,
  successful_referrals integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Index for fast phone lookups
CREATE INDEX IF NOT EXISTS idx_managers_phone ON managers(phone);

-- Index for reward tracking
CREATE INDEX IF NOT EXISTS idx_managers_reward_sent ON managers(reward_sent);

-- Enable Row Level Security
ALTER TABLE managers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can manage managers" ON managers
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Allow authenticated users to read all managers (for admin dashboard)
CREATE POLICY "Authenticated users can read managers" ON managers
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE managers IS 'Store managers who share Pawpaya referral links with franchise owners';
COMMENT ON COLUMN managers.phone IS 'Phone number of the manager (unique identifier)';
COMMENT ON COLUMN managers.reward_sent IS 'Whether the $20 reward has been sent to this manager';
COMMENT ON COLUMN managers.reward_type IS 'Type of reward: gift_card or collar';
COMMENT ON COLUMN managers.total_referrals IS 'Total number of referral links shared';
COMMENT ON COLUMN managers.successful_referrals IS 'Number of referrals who completed onboarding';
