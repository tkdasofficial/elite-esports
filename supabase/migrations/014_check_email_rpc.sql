-- RPC: check if an email is already registered in auth.users
-- Uses SECURITY DEFINER so it can access auth schema from client
CREATE OR REPLACE FUNCTION public.check_email_registered(p_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(trim(p_email))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_email_registered(text) TO anon, authenticated;
