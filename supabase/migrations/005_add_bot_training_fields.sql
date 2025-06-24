-- Add training-related fields to bots table
ALTER TABLE bots ADD COLUMN IF NOT EXISTS last_trained TIMESTAMPTZ;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS document_count INTEGER DEFAULT 0;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS training_status TEXT DEFAULT 'pending';

-- Update existing bots
UPDATE bots SET 
  last_trained = created_at,
  training_status = 'completed'
WHERE last_trained IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_bots_training_status ON bots(training_status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
