INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-voice', 'chat-voice', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload chat images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view chat images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-images');

CREATE POLICY "Users can delete their own chat images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload voice messages"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'chat-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view voice messages"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'chat-voice');

CREATE POLICY "Users can delete their own voice messages"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'chat-voice' AND auth.uid()::text = (storage.foldername(name))[1]);

