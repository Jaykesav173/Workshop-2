# How to Get Your Supabase Service Role Key

## Problem
If your backend can't access the User table (returns 0 rows), you're likely using the **anon key** instead of the **service role key**.

## Solution

### Step 1: Get Your Service Role Key

1. Go to your Supabase Dashboard
2. Click on **Settings** (gear icon in sidebar)
3. Click on **API**
4. Scroll down to find **service_role** key (NOT the anon key)
5. Copy the entire key (it's very long, starts with `eyJ...`)

### Step 2: Update Your .env File

In `VISOR/backend/app/.env`, make sure you have:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your SERVICE_ROLE key here)
```

**OR** use the explicit variable name:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your SERVICE_ROLE key here)
```

### Step 3: Restart Backend

After updating `.env`, restart your backend server.

## Key Differences

- **Anon Key**: Short (~150 chars), respects Row Level Security (RLS), blocks access
- **Service Role Key**: Long (~200+ chars), **bypasses RLS**, full access

## Security Note

⚠️ **NEVER** expose the service role key in frontend code or commit it to public repositories!
The service role key should ONLY be used in backend/server code.


