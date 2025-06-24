-- Add missing tables for full functionality

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  resource_id UUID,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Slack integrations table
CREATE TABLE IF NOT EXISTS slack_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE NOT NULL,
  workspace_id VARCHAR(255) NOT NULL,
  team_id VARCHAR(255) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255),
  access_token TEXT NOT NULL,
  webhook_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_bot_id ON audit_logs(bot_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_bot_id ON slack_integrations(bot_id);
CREATE INDEX IF NOT EXISTS idx_slack_integrations_status ON slack_integrations(status);

-- Add missing columns to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS embedding_count INTEGER DEFAULT 0;

-- Add RLS policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slack_integrations ENABLE ROW LEVEL SECURITY;

-- Audit logs policies
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (
    user_id = auth.uid() OR 
    bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid())
  );

-- Slack integrations policies  
CREATE POLICY "Users can manage their bot integrations" ON slack_integrations
  FOR ALL USING (
    bot_id IN (SELECT id FROM bots WHERE user_id = auth.uid())
  );
