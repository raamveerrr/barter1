CREATE OR REPLACE FUNCTION public.ensure_referral_code(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_referral_code TEXT;
BEGIN
  SELECT referral_code INTO v_referral_code
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_referral_code IS NULL OR v_referral_code = '' THEN
    v_referral_code := gen_random_uuid()::TEXT;
    UPDATE public.profiles
    SET referral_code = v_referral_code
    WHERE id = p_user_id;
  END IF;

  RETURN v_referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.ensure_referral_code(UUID) TO authenticated;

