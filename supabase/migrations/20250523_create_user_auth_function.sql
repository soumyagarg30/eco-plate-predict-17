
-- Create a database function to insert into user_auth table
CREATE OR REPLACE FUNCTION create_user_auth(
  p_email TEXT,
  p_password TEXT,
  p_user_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_auth (email, password, user_type)
  VALUES (p_email, p_password, p_user_type);
END;
$$ LANGUAGE plpgsql;
