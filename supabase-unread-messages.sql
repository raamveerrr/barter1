ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(chat_id, is_read) WHERE is_read = false;

CREATE OR REPLACE FUNCTION public.mark_messages_read(p_chat_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET is_read = true, read_at = NOW()
  WHERE chat_id = p_chat_id
    AND sender_id != auth.uid()
    AND is_read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_messages_read(UUID) TO authenticated;

