CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participants UUID[] NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  item_id UUID REFERENCES public.items(id) ON DELETE SET NULL,
  item_title TEXT,
  price INTEGER NOT NULL CHECK (price >= 0),
  seller_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  seller_name TEXT,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_buyer_id ON public.transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON public.transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE OR REPLACE FUNCTION public.process_purchase(p_buyer UUID, p_item UUID)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_seller UUID;
  v_buyer_balance INTEGER;
  v_transaction_id UUID;
BEGIN
  SELECT * INTO v_item FROM public.items WHERE id = p_item FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  
  IF v_item.status <> 'available' THEN
    RAISE EXCEPTION 'Item is not available for purchase';
  END IF;
  
  IF v_item.owner_id = p_buyer THEN
    RAISE EXCEPTION 'Cannot purchase your own item';
  END IF;
  
  v_seller := v_item.owner_id;
  
  SELECT coins INTO v_buyer_balance FROM public.users WHERE id = p_buyer;
  
  IF v_buyer_balance IS NULL OR v_buyer_balance < v_item.price THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  
  UPDATE public.users 
  SET coins = coins - v_item.price 
  WHERE id = p_buyer;
  
  UPDATE public.users 
  SET coins = coins + v_item.price 
  WHERE id = v_seller;
  
  UPDATE public.items
  SET status = 'sold', updated_at = NOW()
  WHERE id = p_item;
  
  v_transaction_id := gen_random_uuid();
  
  INSERT INTO public.transactions (
    id,
    participants,
    status,
    item_id,
    item_title,
    price,
    seller_id,
    seller_name,
    buyer_id,
    buyer_name,
    created_at
  ) VALUES (
    v_transaction_id,
    ARRAY[p_buyer, v_seller],
    'completed',
    v_item.id,
    v_item.title,
    v_item.price,
    v_seller,
    v_item.seller_name,
    p_buyer,
    (SELECT COALESCE(display_name, email) FROM public.users WHERE id = p_buyer),
    NOW()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'transactionId', v_transaction_id,
    'itemId', v_item.id,
    'price', v_item.price
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.process_purchase(UUID, UUID) TO authenticated;

