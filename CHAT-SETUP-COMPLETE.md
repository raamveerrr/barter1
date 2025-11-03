# Complete Chat System Setup Guide

## Step 1: Run SQL Files (In Supabase SQL Editor)

**Run these in order:**

1. **supabase-chat-optimized.sql** - Creates optimized chat tables (NO recursion issues)
2. **supabase-storage-policies.sql** - Creates storage buckets for images/voice
3. **supabase-presence-optimized.sql** - Creates online status tracking

## Step 2: Enable Real-time in Supabase Dashboard

### Method 1: Via Dashboard (Recommended)
1. Go to Supabase Dashboard → Your Project
2. Navigate to **Database → Replication**
3. Find these tables and **toggle ON**:
   - ✅ `messages`
   - ✅ `chats`
   - ✅ `user_presence`
4. Click **Save**

### Method 2: Via SQL (If dashboard doesn't work)
```sql
-- Already included in supabase-chat-optimized.sql
-- But if needed, run:
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
```

## Step 3: Create Storage Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create bucket: `chat-images` (set to **Public**)
3. Create bucket: `chat-voice` (set to **Public**)

*Note: Storage policies are created by supabase-storage-policies.sql*

## Step 4: Verify Setup

1. Check tables exist: `chats`, `messages`, `user_presence`
2. Check RLS is enabled on all tables
3. Test real-time: Go to Database → Replication, verify tables show "Enabled"

## Architecture

**Simplified Schema:**
- `chats` table: user1_id, user2_id (always user1 < user2 for consistency)
- `messages` table: chat_id, sender_id, text/image_url/voice_url
- NO `chat_participants` table (removed to avoid recursion)

**Benefits:**
- ✅ No recursion issues
- ✅ Faster queries (direct joins)
- ✅ Simpler RLS policies
- ✅ Optimized for 1-to-1 chat

## Testing

After setup, test:
1. Open chat between two users
2. Send a text message - should appear instantly
3. Send an image - should upload and appear
4. Check online status - should show "Online" when user is active

