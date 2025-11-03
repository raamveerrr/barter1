CREATE OR REPLACE FUNCTION public.process_purchase(p_buyer UUID, p_item UUID)
RETURNS JSONB AS $$
DECLARE
  v_item RECORD;
  v_seller UUID;
  v_buyer_balance INTEGER;
  v_seller_balance INTEGER;
  v_transaction_id UUID;
  v_platform_fee INTEGER;
  v_net_amount INTEGER;
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
  
  v_platform_fee := ROUND(v_item.price * 0.05);
  v_net_amount := v_item.price - v_platform_fee;
  
  UPDATE public.users 
  SET coins = coins - v_item.price 
  WHERE id = p_buyer;
  
  UPDATE public.users 
  SET coins = coins + v_net_amount 
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

