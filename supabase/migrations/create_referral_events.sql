-- Referral Analytics Events Table
-- Tracks the full referral funnel: share → view → register → reward

CREATE TABLE IF NOT EXISTS referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_phone text NOT NULL,
  retailer_id uuid REFERENCES retailers(id),
  event_type text NOT NULL CHECK (event_type IN ('share', 'view', 'register', 'reward_sent')),
  metadata jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now()
);

-- Index for fast queries by manager phone
CREATE INDEX IF NOT EXISTS idx_referral_events_manager_phone ON referral_events(manager_phone);

-- Index for fast queries by event type
CREATE INDEX IF NOT EXISTS idx_referral_events_event_type ON referral_events(event_type);

-- Index for fast queries by created_at (for recent events)
CREATE INDEX IF NOT EXISTS idx_referral_events_created_at ON referral_events(created_at DESC);

-- Enable Row Level Security
ALTER TABLE referral_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything
CREATE POLICY "Service role can do everything" ON referral_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Allow authenticated users to read all events (for dashboard)
CREATE POLICY "Authenticated users can read events" ON referral_events
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE referral_events IS 'Tracks referral funnel events: share, view, register, reward_sent';
COMMENT ON COLUMN referral_events.manager_phone IS 'Phone number of the manager who shared the referral link';
COMMENT ON COLUMN referral_events.retailer_id IS 'ID of the retailer (set when they register)';
COMMENT ON COLUMN referral_events.event_type IS 'Type of event: share, view, register, or reward_sent';
COMMENT ON COLUMN referral_events.metadata IS 'Additional event metadata (optional)';
