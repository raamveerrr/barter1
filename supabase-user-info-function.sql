CREATE OR REPLACE FUNCTION public.get_user_display_info(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_display_name TEXT;
  v_email TEXT;
BEGIN
  SELECT 
    COALESCE(raw_user_meta_data->>'display_name', email),
    email
  INTO v_display_name, v_email
  FROM auth.users
  WHERE id = p_user_id;

  IF v_display_name IS NULL THEN
    v_display_name := v_email;
  END IF;

  RETURN jsonb_build_object(
    'display_name', v_display_name,
    'email', v_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_display_info(UUID) TO authenticated;

