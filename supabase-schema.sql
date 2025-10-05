-- Cosmic Match-3 Leaderboard Table
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  rounds_completed INTEGER NOT NULL,
  lives_remaining INTEGER NOT NULL DEFAULT 0,
  game_completed BOOLEAN NOT NULL DEFAULT false,
  upgrades_purchased JSONB DEFAULT '[]'::jsonb,
  play_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leaderboard_score ON leaderboard(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_date ON leaderboard(play_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_completed ON leaderboard(game_completed, total_score DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard (public access)
CREATE POLICY "Public read access" ON leaderboard
  FOR SELECT
  USING (true);

-- Allow anyone to insert scores (public submissions)
CREATE POLICY "Public insert access" ON leaderboard
  FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes (scores are immutable)
CREATE POLICY "No updates allowed" ON leaderboard
  FOR UPDATE
  USING (false);

CREATE POLICY "No deletes allowed" ON leaderboard
  FOR DELETE
  USING (false);
