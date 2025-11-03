CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coin_balance INTEGER NOT NULL DEFAULT 100,
  referral_code TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  has_posted_first_item BOOLEAN NOT NULL DEFAULT false,
  has_made_first_sale BOOLEAN NOT NULL DEFAULT false,
  referral_bonus_paid_out BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON public.profiles(invited_by);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_referral_code TEXT;
  v_referrer_id UUID;
BEGIN
  v_referral_code := NEW.raw_user_meta_data->>'referral_code';
  
  IF v_referral_code IS NOT NULL AND v_referral_code != '' THEN
    SELECT id INTO v_referrer_id
    FROM public.profiles
    WHERE referral_code = v_referral_code
    LIMIT 1;
  END IF;

  INSERT INTO public.profiles (id, invited_by)
  VALUES (
    NEW.id,
    v_referrer_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_first_post_and_referral()
RETURNS TRIGGER AS $$
DECLARE
  v_profile RECORD;
  v_referrer_profile RECORD;
BEGIN
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = NEW.owner_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_profile.has_posted_first_item = false THEN
    UPDATE public.profiles
    SET 
      coin_balance = coin_balance + 25,
      has_posted_first_item = true,
      updated_at = NOW()
    WHERE id = NEW.owner_id;

    IF v_profile.invited_by IS NOT NULL AND v_profile.referral_bonus_paid_out = false THEN
      SELECT * INTO v_referrer_profile
      FROM public.profiles
      WHERE id = v_profile.invited_by
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.profiles
        SET 
          coin_balance = coin_balance + 200,
          updated_at = NOW()
        WHERE id = v_profile.invited_by;

        UPDATE public.profiles
        SET 
          coin_balance = coin_balance + 200,
          referral_bonus_paid_out = true,
          updated_at = NOW()
        WHERE id = NEW.owner_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_item_first_post ON public.items;
CREATE TRIGGER on_item_first_post
  AFTER INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_post_and_referral();

CREATE OR REPLACE FUNCTION public.handle_first_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_profile RECORD;
BEGIN
  IF NEW.status != 'completed' OR NEW.seller_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = NEW.seller_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF v_profile.has_made_first_sale = false THEN
    UPDATE public.profiles
    SET 
      coin_balance = coin_balance + 150,
      has_made_first_sale = true,
      updated_at = NOW()
    WHERE id = NEW.seller_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_transaction_first_sale ON public.transactions;
CREATE TRIGGER on_transaction_first_sale
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_first_sale();

