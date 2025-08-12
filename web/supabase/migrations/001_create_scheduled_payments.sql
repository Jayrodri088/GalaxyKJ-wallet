-- Create the scheduled_payments table
CREATE TABLE IF NOT EXISTS scheduled_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL,
    encrypted_secret TEXT NOT NULL,
    recipient TEXT NOT NULL,
    asset TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    memo TEXT,
    frequency TEXT NOT NULL CHECK (frequency IN ('once', 'weekly', 'monthly', 'yearly')),
    execute_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE,
    tx_hash TEXT,
    last_error TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_user_id ON scheduled_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_status_execute_at ON scheduled_payments(status, execute_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_payments_user_status ON scheduled_payments(user_id, status);

-- Enable Row Level Security (RLS)
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own scheduled payments
CREATE POLICY "Users can view own scheduled payments" ON scheduled_payments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own scheduled payments
CREATE POLICY "Users can insert own scheduled payments" ON scheduled_payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own scheduled payments
CREATE POLICY "Users can update own scheduled payments" ON scheduled_payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own scheduled payments
CREATE POLICY "Users can delete own scheduled payments" ON scheduled_payments
    FOR DELETE USING (auth.uid() = user_id);