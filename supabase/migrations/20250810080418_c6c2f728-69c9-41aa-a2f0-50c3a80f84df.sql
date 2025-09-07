-- Delete all files in the 'ads' storage bucket, then delete the bucket itself
DELETE FROM storage.objects WHERE bucket_id = 'ads';
DELETE FROM storage.buckets WHERE id = 'ads';