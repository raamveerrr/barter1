# Coin Rewards System - Complete Setup Guide

## Overview

This system implements a complete coin reward and onboarding system with:
- ✅ 100 Coins on signup (default)
- ✅ 25 Coins for first post
- ✅ 150 Coins for first sale
- ✅ 200 Coins for both users when referral is used and friend posts first item

## Setup Instructions

### Step 1: Run SQL Schema

Run `supabase-coin-rewards-schema.sql` in your Supabase SQL Editor. This creates:

1. **profiles table** with all required columns:
   - `coin_balance` (default: 100)
   - `referral_code` (unique, auto-generated)
   - `invited_by` (links to referrer)
   - `has_posted_first_item` (boolean)
   - `has_made_first_sale` (boolean)
   - `referral_bonus_paid_out` (boolean)

2. **Database Functions & Triggers**:
   - `handle_new_user()` - Triggers on new user signup, creates profile, links referral
   - `handle_first_post_and_referral()` - Triggers on first item post, awards 25 coins + referral bonus
   - `handle_first_sale()` - Triggers on first completed transaction, awards 150 coins

### Step 2: Verify Components

All React components are created and integrated:

- ✅ **OnboardingModal** - Shows on first login (auto-displays)
- ✅ **RewardTracker** - Shows on Home page dashboard
- ✅ **ReferralPage** - Available at `/referral` route
- ✅ **Signup Form** - Updated with referral code field

### Step 3: Test the System

1. **Sign Up Test:**
   - Create a new account
   - Check profile in Supabase - should have 100 coins
   - Onboarding modal should appear

2. **First Post Test:**
   - Post your first item
   - Check profile - should have 125 coins (100 + 25)
   - `has_posted_first_item` should be true

3. **Referral Test:**
   - User A: Get referral code from `/referral` page
   - User B: Sign up with User A's referral code
   - User B: Post first item
   - Both users should get 200 coins each
   - User A: 325 coins (100 + 25 + 200)
   - User B: 325 coins (100 + 25 + 200)

4. **First Sale Test:**
   - Complete a sale (transaction status = 'completed')
   - Seller should get 150 coins
   - `has_made_first_sale` should be true

## Component Details

### OnboardingModal
- Auto-shows on first login
- Uses localStorage to track if user has seen it
- Styled with premium dark theme
- Shows all 4 reward types

### RewardTracker
- Displays current coin balance
- Shows next reward opportunity
- Real-time updates via Supabase Realtime
- Located on Home page dashboard

### ReferralPage
- Shows user's unique referral code
- Copy link/code functionality
- Displays reward status
- Available at `/referral` route

### Updated Signup Form
- Optional referral code field
- Auto-fills from URL parameter `?ref=CODE`
- Passes referral code to backend via user metadata

## Database Schema

```sql
profiles table:
- id (UUID, PK, FK to auth.users)
- coin_balance (INTEGER, default: 100)
- referral_code (TEXT, UNIQUE, auto-generated)
- invited_by (UUID, FK, nullable)
- has_posted_first_item (BOOLEAN, default: false)
- has_made_first_sale (BOOLEAN, default: false)
- referral_bonus_paid_out (BOOLEAN, default: false)
- created_at, updated_at
```

## Reward Flow

1. **Signup** → Profile created with 100 coins
2. **First Post** → +25 coins, `has_posted_first_item = true`
3. **First Sale** → +150 coins, `has_made_first_sale = true`
4. **Referral** → When friend posts first item:
   - Friend gets +200 coins
   - Referrer gets +200 coins
   - `referral_bonus_paid_out = true` for friend

## Security

- All functions use `SECURITY DEFINER` for proper permissions
- RLS policies on profiles table
- Users can only update their own profile
- Referral code validation in trigger functions

## Troubleshooting

**Issue:** Profile not created on signup
- Check if `handle_new_user` trigger exists
- Verify trigger is enabled on `auth.users` table

**Issue:** Coins not awarded
- Check transaction status is 'completed' for first sale
- Verify item insert triggers are working
- Check Supabase logs for errors

**Issue:** Referral not working
- Verify referral code is passed in user metadata
- Check `invited_by` is set correctly
- Ensure friend posts item (not just signs up)

