-- Fix remaining functions with search path issues
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into regular users table
  INSERT INTO public.users (id, name, email, role, is_anonymous)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user'),
    COALESCE((NEW.raw_user_meta_data ->> 'is_anonymous')::boolean, false)
  );

  -- If user role is government, also create government_users entry
  IF COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'user') = 'government' THEN
    INSERT INTO public.government_users (user_id, full_name, designation, region_id, government_id_url)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'name', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'designation', ''),
      CASE 
        WHEN NEW.raw_user_meta_data ->> 'region_id' IS NOT NULL 
        THEN (NEW.raw_user_meta_data ->> 'region_id')::uuid 
        ELSE NULL 
      END,
      NEW.raw_user_meta_data ->> 'government_id_url'
    );
  END IF;

  -- Create user status record
  INSERT INTO public.user_status (user_id, status, strike_count)
  VALUES (NEW.id, 'active', 0);

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;