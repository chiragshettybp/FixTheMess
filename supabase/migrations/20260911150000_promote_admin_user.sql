-- Promote ichiragshetty@gmail.com to superadmin (idempotent)
--
-- Ensures the auth user exists, ensures a public.users profile exists,
-- then sets role = 'superadmin'.
--
-- NOTE: The prevent_role_self_escalation_trigger blocks non-admin role
-- changes; this migration temporarily disables it.

ALTER TABLE public.users DISABLE TRIGGER prevent_role_self_escalation_trigger;

DO $$
DECLARE
  v_uid UUID;
BEGIN
  -- 1. Make sure the auth user exists (only for fresh environments)
  SELECT id INTO v_uid FROM auth.users WHERE email = 'ichiragshetty@gmail.com' LIMIT 1;

  IF v_uid IS NULL THEN
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated',
      'authenticated', 'ichiragshetty@gmail.com', crypt('FtM@Admin2026!', gen_salt('bf')),
      now(), '{"provider":"email","providers":["email"]}',
      '{"name":"Admin"}', now(), now())
    RETURNING id INTO v_uid;
  END IF;

  -- 2. Ensure public.users profile exists, then promote
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_uid) THEN
    INSERT INTO public.users (id, email, name, role, is_anonymous, created_at, updated_at)
    VALUES (v_uid, 'ichiragshetty@gmail.com', 'Admin', 'superadmin', false, now(), now());
  ELSE
    UPDATE public.users SET role = 'superadmin', updated_at = now() WHERE id = v_uid;
  END IF;
END $$;

ALTER TABLE public.users ENABLE TRIGGER prevent_role_self_escalation_trigger;