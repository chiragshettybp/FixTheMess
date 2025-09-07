-- Assign Delhi Central region to all existing government users as a default
UPDATE government_users 
SET region_id = '2b125ae1-0ebe-46ad-b540-8ca9870d1579'
WHERE region_id IS NULL;