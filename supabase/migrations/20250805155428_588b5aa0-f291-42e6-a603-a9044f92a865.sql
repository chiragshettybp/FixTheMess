-- Ensure resolved-images bucket exists and has proper policies
DO $$
BEGIN
    -- Create bucket if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'resolved-images') THEN
        INSERT INTO storage.buckets (id, name, public) VALUES ('resolved-images', 'resolved-images', true);
    END IF;
END $$;

-- Create policies for resolved-images bucket
DO $$
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Government users can upload resolved images" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view resolved images" ON storage.objects;
    DROP POLICY IF EXISTS "Government users can update resolved images" ON storage.objects;
    DROP POLICY IF EXISTS "Government users can delete resolved images" ON storage.objects;
    
    -- Create new policies
    CREATE POLICY "Government users can upload resolved images"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'resolved-images' 
        AND get_current_user_role() = 'government'
    );

    CREATE POLICY "Anyone can view resolved images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'resolved-images');

    CREATE POLICY "Government users can update resolved images"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'resolved-images' 
        AND get_current_user_role() = 'government'
    );

    CREATE POLICY "Government users can delete resolved images"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'resolved-images' 
        AND get_current_user_role() = 'government'
    );
END $$;