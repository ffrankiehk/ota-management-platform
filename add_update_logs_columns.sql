-- Add missing columns to update_logs table
ALTER TABLE update_logs 
ADD COLUMN IF NOT EXISTS download_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS install_time_ms INTEGER,
ADD COLUMN IF NOT EXISTS device_info JSON,
ADD COLUMN IF NOT EXISTS installed_at TIMESTAMP WITH TIME ZONE;

-- Verify columns added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'update_logs' 
ORDER BY ordinal_position;
