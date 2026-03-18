-- Update admin password to 'admin123'
UPDATE users 
SET password_hash = '$2a$10$mhzB1O.d3luMkMkiyWJKXujSYtVljBVKcxIPE1RVoBpTqklbwP6RK' 
WHERE email = 'admin@example.com';

-- Verify the update
SELECT 
  email, 
  role, 
  LENGTH(password_hash) as hash_length,
  SUBSTRING(password_hash, 1, 10) as hash_prefix
FROM users 
WHERE email = 'admin@example.com';
