CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rater_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rated_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rater_id, rated_user_id, transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_rated_user ON public.ratings(rated_user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rater ON public.ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_ratings_transaction ON public.ratings(transaction_id);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can create ratings for their transactions"
  ON public.ratings FOR INSERT
  WITH CHECK (
    rater_id = auth.uid()
    AND (
      transaction_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.transactions
        WHERE id = transaction_id
        AND (buyer_id = auth.uid() OR seller_id = auth.uid())
        AND status = 'completed'
      )
    )
  );

CREATE POLICY "Users can update their own ratings"
  ON public.ratings FOR UPDATE
  USING (rater_id = auth.uid());

CREATE POLICY "Users can delete their own ratings"
  ON public.ratings FOR DELETE
  USING (rater_id = auth.uid());

