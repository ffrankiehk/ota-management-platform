-- Add missing columns to releases table
ALTER TABLE releases 
ADD COLUMN IF NOT EXISTS bundle_type VARCHAR(20) DEFAULT 'js-bundle',
ADD COLUMN IF NOT EXISTS signature TEXT,
ADD COLUMN IF NOT EXISTS patch_from_version VARCHAR(50),
ADD COLUMN IF NOT EXISTS target_platform VARCHAR(20) DEFAULT 'react-native';
